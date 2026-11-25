-- Tenant isolation. Run as the table owner after every drizzle/pg migration.
-- seo_server is the app's login and is not limited by row (sign-in, jobs,
-- account pages). seo_app is what project requests switch to (withTenant).
-- Never create these roles with the Neon CLI or console: those bypass RLS.
begin;

do $$ begin
  if not exists (select from pg_roles where rolname = 'seo_server') then
    create role seo_server login nobypassrls noinherit; -- set its password separately
  end if;
  if not exists (select from pg_roles where rolname = 'seo_app') then
    create role seo_app nologin nobypassrls noinherit;
  end if;
end $$;
grant seo_app to seo_server;
create schema if not exists guard;
grant usage on schema public, guard to seo_app, seo_server;
grant usage on all sequences in schema public to seo_app, seo_server;

create or replace function guard.org() returns text language sql stable as
  $$select nullif(current_setting('app.org', true), '')$$;
create or replace function guard.usr() returns text language sql stable as
  $$select nullif(current_setting('app.user', true), '')$$;

create or replace function guard.put(t text, name text, role text, cond text)
returns void language plpgsql as $$
begin
  execute format('%s policy %I on public.%I to %I using (%s) with check (%s)',
    case when exists (select from pg_policies where schemaname = 'public' and tablename = t and policyname = name)
      then 'alter' else 'create' end, name, t, role, cond, cond);
end $$;
revoke all on function guard.put from public;

do $$
declare
  t text; fk record; cond text;
  accounts text[] := array['user','session','account','verification','organization','member','invitation','apikey','guest_accounts','account_deletion_requests','user_signup_campaigns','every_app_transfers','every_app_transfer_users','telemetry_state'];
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('grant select, insert, update, delete on public.%I to seo_server', t);
    perform guard.put(t, 'server', 'seo_server', 'true');
    execute format('revoke all on public.%I from seo_app', t);
    continue when t = any(accounts) or t like 'stripe_projects_%';

    -- Onboarding answers are one row per person, in whichever organization.
    select coalesce(string_agg(case column_name
        when 'user_id' then ' and user_id = (select guard.usr())'
        else ' and organization_id = (select guard.org())' end, ''), '')
      into cond from information_schema.columns
      where table_schema = 'public' and table_name = t
        and (column_name = 'user_id' or (column_name = 'organization_id' and t <> 'user_onboarding_answers'));
    -- Every parent must be visible too: foreign keys alone ignore RLS.
    for fk in
      select distinct a.attname c, f.relname p, fa.attname pc, a.attnotnull required
      from pg_constraint k
      join pg_attribute a on a.attrelid = k.conrelid and a.attnum = k.conkey[1]
      join pg_class f on f.oid = k.confrelid
      join pg_attribute fa on fa.attrelid = k.confrelid and fa.attnum = k.confkey[1]
      where k.contype = 'f' and k.conrelid = format('public.%I', t)::regclass
        and f.relname <> all(accounts)
    loop
      cond := cond || format(' and (%s%I in (select x.%I from public.%I x))',
        case when fk.required then '' else format('%I is null or ', fk.c) end, fk.c, fk.pc, fk.p);
    end loop;
    if cond = '' then raise exception 'pg-rls: no owner path for table %', t; end if;
    execute format('grant select, insert, update, delete on public.%I to seo_app', t);
    perform guard.put(t, 'tenant', 'seo_app', substr(cond, 6));
  end loop;
end $$;

-- What a request may see of accounts: its members, and their Google data links.
grant select on public.organization, public.member, public.invitation, public."user" to seo_app;
grant select, update (access_token, access_token_expires_at, refresh_token, updated_at) on public.account to seo_app;
select guard.put('organization', 'tenant', 'seo_app', 'id = (select guard.org())');
select guard.put('member', 'tenant', 'seo_app', 'organization_id = (select guard.org())');
select guard.put('invitation', 'tenant', 'seo_app', 'organization_id = (select guard.org())');
select guard.put('user', 'tenant', 'seo_app', 'id = (select guard.usr()) or id in (select m.user_id from public.member m)');
-- A Google grant belongs to a person, who may be in several organizations: a
-- request sees its own person's, and others' only when linked to its projects.
select guard.put('account', 'tenant', 'seo_app', $$provider_id in ('google-search-console', 'google-analytics') and (
  user_id = (select guard.usr()) or user_id in (select m.user_id from public.member m) and (
    provider_id = 'google-search-console' and exists (select from public.gsc_connections c
      where c.connected_by_user_id = account.user_id and (c.gsc_account_id = account.account_id or c.gsc_account_id is null))
    or provider_id = 'google-analytics' and exists (select from public.ga4_connections c
      where c.connected_by_user_id = account.user_id and c.ga4_account_id = account.account_id)))$$);

commit;
