# Branding Inventory

## Product Identity

| Element | Value | Location |
|---|---|---|
| Product name | OpenSEO | Throughout codebase |
| Company | Every App, Inc. | `web/content/marketing/about.mdx:112` |
| Domain | openseo.so | Multiple marketing/legal files |
| Plugin namespace | `plugins/openseo/` | Repo root |

## Logos

| Asset | Path |
|---|---|
| Plugin icon | `plugins/openseo/assets/icon.png` |
| Transparent logo | `/transparent-logo.png` (served from web/public, referenced in `src/client/components/StatusScreen.tsx:49`, `src/client/features/onboarding/OnboardingCard.tsx:24`, `src/client/features/auth/AuthPage.tsx:114`) |
| Test fixture logo | `tests/badseo/public/openseo-logo.png` |

## Emails

| Email | Purpose | Locations |
|---|---|---|
| `support@openseo.so` | Customer support (primary) | `src/client/lib/support.ts:1`, `web/src/routes/_marketing/support.tsx:6`, `src/routes/_app/billing_.fix-payment.tsx:22`, `web/src/components/money-back-guarantee.tsx:2`, `web/content/marketing/about.mdx:112`, `web/content/legal/privacy.md`, `web/content/legal/terms-and-conditions.md`, `web/content/marketing/ahrefs-alternative.mdx`, `web/content/marketing/semrush-alternative.mdx`, `web/content/blogs/best-open-source-seo-tools.md`, `web/content/docs/chatgpt.md` |
| `support@goodshepherdinsights.com` | Error catalog support emails | `src/shared/errors.ts:11,39,44,105,127,132,137,144,166,188,207` |
| `admin@localhost` | Local dev noauth admin | `scripts/seed-rank-tracking.ts:39`, `scripts/seed-projects.ts:35`, `src/middleware/ensure-user/delegated.ts:11`, `docs/LOCAL_DEVELOPMENT.md:125`, `docs/SELF_HOSTING_DOCKER.md:5` |

## Third-Party Branding References

| Brand | Context | Locations |
|---|---|---|
| Google (GoogleLogo) | OAuth login button | `src/client/features/auth/AuthPage.tsx:59,76` |
| Google Search Console | Integration logo | `src/client/features/dashboard/DashboardCards.tsx:1` (`GoogleSearchConsoleLogo`) |
| DataForSEO | Provider references in error messages | `src/server/lib/dataforseoBillingClassification.ts`, `src/server/lib/dataforseo/*.ts` |
| Cloudflare | Auth mode, Workers | `src/middleware/ensure-user/cloudflareAccess.ts`, `src/lib/auth.ts` |
| Autumn | Billing provider | `src/server/billing/autumn.ts`, `src/shared/billing.ts` |
| Better Auth | Auth library | `src/lib/auth.ts`, `src/db/better-auth-schema.ts` |
| Stripe | Payment processing | `src/serverFunctions/billing.ts`, `src/shared/billing.ts` |
| Ahrefs | Competitor reference | `src/serverFunctions/ahrefs.ts`, `web/content/marketing/ahrefs-alternative.mdx` |
| Semrush | Competitor reference | `web/content/marketing/semrush-alternative.mdx` |
| ChatGPT / Anthropic (Claude) | AI providers | `src/server/lib/dataforseo/ai.ts`, `src/shared/ai-prompt-suggestions.ts` |
| OpenRouter | LLM provider | `src/server/lib/openrouter.ts` |

## Physical Address (Legal)

| Address | Location |
|---|---|
| 34 Harding Street, Cambridge, Massachusetts 02141 | `web/content/legal/terms-and-conditions.md:102,129,131` |

## UI Branding Elements

| Element | Location |
|---|---|
| `transparent-logo.png` reference | `src/client/components/StatusScreen.tsx:49` |
| `transparent-logo.png` reference | `src/client/features/onboarding/OnboardingCard.tsx:24` |
| `transparent-logo.png` reference | `src/client/features/auth/AuthPage.tsx:114` |
| GoogleLogo component | `src/client/features/auth/AuthPage.tsx:76` |
| `icon.png` plugin icon | `plugins/openseo/assets/icon.png` |
| `icon.png` reference | `plugins/openseo/.claude-plugin/plugin.json`, `plugins/openseo/.codex-plugin/plugin.json` |
