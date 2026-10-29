# Rebuild list — upstream v0.1.13 → v0.1.20 merge

Tracks everything that must be rebuilt, re-decided, or re-verified as a result of
merging `every-app/open-seo` main (`f24a8334`, v0.1.20) into the Maryland
Insights fork. Fork tip before the merge: `c9f473e8`. Merge base: `d7ea7852`
(upstream v0.1.13).

Status key: **TODO** not started · **DONE** completed in this PR ·
**BLOCKED** needs a decision from Nerdy/Alpha · **WONTFIX** deliberately not done

---

## 1. Blocked on a pricing decision

### 1.1 Pro and Agency tiers are not offered — **BLOCKED**

Upstream now sells three tiers (#1093, #1090, #1106). Its prices are upstream's:
Pro $30/mo, Agency $200/mo. Maryland Insights has no approved price for either,
so `TIER_PLAN_OFFERS` was reduced to `[BASE_PLAN_OFFER]` and `TIERS` in
`subscribe-tiers.ts` to `base` only. `PRO_PLAN_OFFER` / `AGENCY_PLAN_OFFER` were
removed rather than shipped at upstream prices.

To rebuild: decide whether MI sells Pro/Agency and at what price, then restore
the offers and tier entries. Autumn plan IDs (`AUTUMN_PRO_PLAN_ID`,
`AUTUMN_AGENCY_PLAN_ID`) still exist in `src/shared/billing.ts`.

### 1.2 Annual billing is hidden — **BLOCKED**

Upstream added a Yearly switch with `annualPriceUsd` per tier; its Base annual
price is $100/yr, which is incoherent against MI's $199.99/mo. `annualPriceUsd`
is now `number | null`, Base is `null`, and the switch plus `AnnualPlanDialog`
render only when some tier has a non-null annual price.

To rebuild: set MI's annual price(s), then the existing UI re-enables itself.

### 1.3 SAM's fact sheet pricing — **DONE (needs confirmation)**

`src/server/features/sam/openseo-fact-sheet.md` feeds the in-app agent. Upstream
rewrote it to advertise "plans start at $10/month" with the three-tier list.
Reverted to MI's single `$199.99/month` + `$200.00` monthly credits. Confirm
these figures against Autumn before release — the deployment SOP requires
reading the plan back from the verified Autumn account.

---

## 2. Pre-existing bugs found during the merge (NOT fixed — need authorization)

### 2.1 Error messages show a literal `${ERROR_SUPPORT_EMAIL}` — **TODO**

10 of 37 entries in `src/shared/errors.ts` embed `${ERROR_SUPPORT_EMAIL}` inside
**double-quoted** strings. The constant is never imported into that file and
nothing substitutes it at runtime, so customers literally read:

> "We couldn't load your billing info. Email ${ERROR_SUPPORT_EMAIL} and we'll sort it out."

Live in production today; the merge neither caused nor fixed it. Fix is to
import `ERROR_SUPPORT_EMAIL` from `@/shared/branding` and convert those 10
messages to template literals.

### 2.2 28 distinct validation errors collapsed into `nameRequired` — **TODO**

The fork's bulk error-catalog migration mapped semantically unrelated failures to
`nameRequired` = "Give this a name so you can find it later." Affected:
`ReportService.ts` (7), `ReportTemplateService.ts` (9), `contextUpdateOps.ts` (4),
`RankTrackingService.ts` (3 — 2 remaining after this PR), plus others.

Two of these sat in merge conflicts and were fixed here by adding correct catalog
entries (`rankTrackerDuplicate`, `rankKeywordCostApproval`). The remaining ~26
need per-site triage and proper catalog entries.

### 2.3 Duplicate migration number prefixes — **DONE**

Pre-existing `0029_user_agent_id` / `0029_rank_keyword_pins` (pg) and
`0051_user_agent_id` / `0051_rank_keyword_pins` (sqlite) collisions are gone:
taking upstream's journals orphaned the fork's `user_agent_id` files (no journal
entry, so drizzle ignored them) and they were deleted. Both directories now have
no duplicate prefixes. See 2.4 — this has a deploy consequence.

### 2.4 `agent_id` migration collision — **DONE (verified against live data)**

The regenerated `0063` re-added `ALTER TABLE user ADD agent_id`, which would have
failed on the live D1 database. Resolved and proven:

Read-only inspection of the live `d1_migrations` table (57 rows, tip
`0055_chief_centennial`) showed **both** `0051_rank_keyword_pins.sql` (id 52) and
`0051_user_agent_id.sql` (id 53) already applied, and `user.agent_id` present.

Fix: `drizzle/sqlite/0051_user_agent_id.sql` was restored, and the `agent_id`
statement removed from `0063_tired_colleen_wing.sql`. `wrangler d1 migrations
apply` matches by **filename** against `d1_migrations`, so production skips
`0051_user_agent_id` as applied while a fresh D1 still gets the column in
sequence. `0063` now only creates `dashboard_card_positions`.

Verified by replaying all pending migrations against a **copy** of the live
database (the live DB was never written to). All 8 applied cleanly:

    0056_flowery_misty_knight · 0057_heavy_johnny_storm · 0058_flaky_devos
    0059_thankful_aaron_stack · 0060_reflective_wrecker · 0061_bumpy_fat_cobra
    0062_bind_api_keys_to_organization · 0063_tired_colleen_wing

Post-migration: `agent_id`, `terms_accepted_version`, `product_updates_opt_in`
all present, `dashboard_card_positions` created, existing user rows preserved.

The duplicate `0051` filename prefix is therefore **intentional** — it mirrors
what production has actually applied. The pg side keeps `agent_id` in `0041`
(correct for a fresh Postgres install via drizzle's journal); any pre-existing
Postgres deployment would need the same reconciliation.

---

## 3. Behaviour changes adopted from upstream (verify against expectations)

| Change                                          | Upstream PR         | Note                                                                                                                                                                              |
| ----------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rendered-audit page cap removed                 | #1085               | `RENDERED_MAX_AUDIT_PAGES` no longer exists; replaced by `RENDERED_CRAWL_TIME_LIMIT_HOURS = 22`. The fork's cap check was deleted — rendered audits can now exceed the old limit. |
| Workflow errors use `NonRetryableError`         | —                   | The fork had replaced these with `AppError`, which loses Cloudflare Workflows' non-retry semantics and risks retry loops. Upstream behaviour restored in `RankCheckWorkflow.ts`.  |
| Audit rendering error is specific               | —                   | Fork mapped "rendering unavailable" to `forbidden`; now `AUDIT_RENDERING_UNAVAILABLE` with upstream's message.                                                                    |
| MCP credentials bound to one org                | #1019               | Fork's `resolveTargetOrganization` in `create-project.ts` removed; upstream's binding + "Connected agents" revoke flow replaces it.                                               |
| Affirmative Terms acceptance                    | #945, #0e13519f     | Fork's passive Terms notice on sign-up replaced by upstream's `TermsAgreementNotice`.                                                                                             |
| `PrivacySettings` replaces the Analytics toggle | #942                | Fork's custom Analytics section in settings superseded by upstream's privacy choices UI.                                                                                          |
| Two new auth modes                              | #1067, #664         | `AUTH_MODE=everyapp` and `AUTH_MODE=password` now exist. MI stays on `hosted`.                                                                                                    |
| Toolchain majors                                | #1041, #1051, #1095 | Vite 8, Vitest 5, zod 4.6, newer MCP SDK.                                                                                                                                         |

---

## 4. Branding — re-applied, with known gaps

Hardcoded `OpenSEO` in `src` went 150 (fork) → 305 (upstream merge) before
remediation. 50 files regressed, 99 net new strings, 47 of them brand-new
upstream files.

### 4.1 Re-branded in this PR — **DONE**

`AppShellParts`, `McpConnectionsSettings`, `SecretHelpPage`,
`AnalyticsOnboardingStep`, `OpenRouterKeyGate`, `DashboardAgentCard`,
`PrivacySettings`, `AuthErrorCard`, `SearchConsoleWidget`, `_authenticated.tsx`,
`help/openrouter-api-key`, `help/dataforseo-api-key`, `mcp-widgets/useWidgetHost`,
`mcp-widgets/main`, `mcp-widgets/SearchConsoleConnection`, `_auth.sign-up`,
`_authenticated.subscribe`, `_app/ai.tsx`.

`_authenticated.subscribe.tsx` ("Welcome to OpenSEO!") was already unbranded
before the merge — fixed here as well.

### 4.2 Deliberately left as upstream — **WONTFIX**

- `CRAWLER_USER_AGENT = "OpenSEO-Audit/1.0"` and the `OpenSEO-Audit` strings in
  `shared/audit-issues.ts` and `ResultsView.tsx`. Protocol identifier; changing
  it breaks customer WAF allowlists. `branding.ts` documents this.
- `appInfo: { name: "OpenSEO" }` in `mcp-widgets/useWidgetHost.ts` — MCP protocol
  identity. Confirm whether any client surfaces it to users.
- Internal code comments mentioning OpenSEO.
- Marketing site (`web/`) and public share pages (`reports/sharePage.tsx`, 7
  strings) — the deployment SOP states marketing pages remain untouched.

### 4.3 Still hardcoded, lower priority — **TODO**

Agent/MCP-facing descriptions, not customer UI chrome:
`samSystemPrompt.ts` (5), `mcp/tools/google-analytics-tools.ts` (10),
`google-connection-tools.ts` (6), `everyapp/tools.ts` (5),
`middleware/ensure-user/everyApp.ts` (5), `features/google/*`, `email/loops.ts` (3),
plus test fixtures. These reach users only through an agent's wording.

### 4.4 Fact sheet body — **TODO**

`openseo-fact-sheet.md` still says "OpenSEO" throughout and points support at
`support@openseo.so`. Pricing is corrected (1.3) but the prose and support email
are not. SAM quotes this.

---

## 5. Merge mechanics completed

| Item                                                                                                                      | Status                        |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| 40 conflicting files resolved                                                                                             | DONE                          |
| `agentId` + upstream Terms/product-update columns coexist in both schemas                                                 | DONE                          |
| `@dnd-kit/react` retained for the card-reorder feature                                                                    | DONE                          |
| `publicDir: "src/public"` preserved (upstream adopted it independently)                                                   | DONE                          |
| MI tunnel hosts re-added to `vite.config.ts` `allowedHosts`                                                               | DONE                          |
| SEO Coach footnote re-removed (upstream reintroduced it twice)                                                            | DONE                          |
| Privacy/Terms/PrivacyChoices links kept in the MI footer; every-app GitHub/Discord links omitted                          | DONE                          |
| Migrations regenerated at pg `0041` / sqlite `0063`; orphaned `user_agent_id` files deleted; no duplicate prefixes remain | DONE                          |
| `pnpm build` (vite build + `tsc --noEmit`)                                                                                | DONE — exit 0                 |
| Test suite                                                                                                                | DONE — no new failures; see 7 |

---

## 7. Test suite status

The suite was **already red on the fork** before this merge. Measured by running
it on a clean worktree at `c9f473e8`:

|       | Pre-merge `c9f473e8`           | Post-merge (this PR)           |
| ----- | ------------------------------ | ------------------------------ |
| Tests | 55 failed / 1547 passed (1602) | 49 failed / 1778 passed (1827) |
| Files | 18 failed / 212 passed (230)   | 17 failed / 247 passed (264)   |

**Zero new failures.** Nine baseline failures are fixed, and the 225 tests
upstream added all pass. Two entries that first appeared to be new were
parameterized-test label differences only — per-file failure counts are
identical (`ReportService.test.ts` 9 → 9, `rendered-page.test.ts` 13 → 13).

### 7.1 Why the remaining 49 fail — **TODO**

Almost all are "refuses …" assertions expecting upstream's specific error text
while the fork's catalog returns generic copy. Example:

    Expected: "No report report_gone in this project. Call list_reports, …"
    Received: "We couldn't find that. It may have been moved or deleted."

This is the same root cause as 2.2. Fixing 2.2 should clear most of them. The
work is to decide, per site, whether the catalog entry should carry upstream's
specific wording.

---

## 6. Deployment — NOT DONE

This PR is not deployed. The live container still runs
`127.0.0.1:5000/gsi/open-seo:0.1.37` (built 2026-10-16 from `597f001d`).

Deploying needs Nerdy's explicit approval because it involves:

- new DB migrations on both PG and SQLite (irreversible); the D1 path is now
  verified against a copy of live data (2.4),
- three major dependency bumps (Vite 8, Vitest 5, zod 4.6),
- auth-mode restructuring on a live hosted-auth deployment,
- billing/checkout changes.

Follow `~/.hermes/skills/open-seo-deployment` and preserve the `/app/.wrangler`
state volume and the `open-seo` container name (the tunnel ingress resolves
`http://open-seo:3001`).
