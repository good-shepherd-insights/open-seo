# Branding Inventory

## Product Identity

| Element          | Value                           | Location                                        |
| ---------------- | ------------------------------- | ----------------------------------------------- |
| Product name     | OpenSEO                         | Throughout codebase                             |
| Company          | Every App, Inc.                 | `web/content/marketing/about.mdx:112`           |
| Domain           | openseo.so                      | Multiple marketing/legal files                  |
| Plugin namespace | `plugins/openseo/`              | Repo root                                       |
| GitHub repo      | `github.com/every-app/open-seo` | Plugin configs, README, marketing pages         |
| Hosted app       | `app.openseo.so`                | `plugins/openseo/skills/setup-openseo/SKILL.md` |

## Logos

| Asset                  | Path                                                                                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plugin icon            | `plugins/openseo/assets/icon.png`                                                                                                                                                                                |
| Transparent logo       | `/transparent-logo.png` (served from web/public, referenced in `src/client/components/StatusScreen.tsx:49`, `src/client/features/onboarding/OnboardingCard.tsx:24`, `src/client/features/auth/AuthPage.tsx:114`) |
| Cursor plugin logo URL | `https://raw.githubusercontent.com/every-app/open-seo/main/public/transparent-logo.png` in `plugins/openseo/.cursor-plugin/plugin.json`                                                                          |
| Test fixture logo      | `tests/badseo/public/openseo-logo.png`                                                                                                                                                                           |
| README hero image      | `https://github.com/user-attachments/assets/8ebdc439-3e72-41ab-8bde-8cda771ef2e8` in `README.md`                                                                                                                 |

## Emails

| Email                              | Purpose                      | Locations                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `support@openseo.so`               | Customer support (primary)   | `src/client/lib/support.ts:1`, `web/src/routes/_marketing/support.tsx:6`, `src/routes/_app/billing_.fix-payment.tsx:22`, `web/src/components/money-back-guarantee.tsx:2`, `web/content/marketing/about.mdx:112`, `web/content/legal/privacy.md`, `web/content/legal/terms-and-conditions.md`, `web/content/marketing/ahrefs-alternative.mdx`, `web/content/marketing/semrush-alternative.mdx`, `web/content/blogs/best-open-source-seo-tools.md`, `web/content/docs/chatgpt.md` |
| `support@goodshepherdinsights.com` | Error catalog support emails | `src/shared/errors.ts:11,39,44,105,127,132,137,144,166,188,207`                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `admin@localhost`                  | Local dev noauth admin       | `scripts/seed-rank-tracking.ts:39`, `scripts/seed-projects.ts:35`, `src/middleware/ensure-user/delegated.ts:11`, `docs/LOCAL_DEVELOPMENT.md:125`, `docs/SELF_HOSTING_DOCKER.md:5`                                                                                                                                                                                                                                                                                               |

## Social Links

| Platform | URL                                                     | Locations                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub   | `https://github.com/every-app/open-seo`                 | `tests/badseo/src/lib.ts`, `tests/badseo/src/components/site-layout.tsx`, `plugins/openseo/.codex-plugin/plugin.json`, `plugins/openseo/.claude-plugin/plugin.json`, `plugins/openseo/.cursor-plugin/plugin.json`, `plugins/openseo/README.md`, `web/content/marketing/openseo-vs-dataforseo.mdx`, `web/content/marketing/open-source-seo.md`, `web/content/marketing/ahrefs-alternative.mdx`, `web/content/marketing/about.mdx`, `web/content/docs/self-hosting/docker.md` |
| Discord  | `https://discord.gg/c9uGs3cFXr`                         | `web/content/marketing/why-openseo.mdx`                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Reddit   | `https://www.reddit.com/r/TechSEO/comments/1r7qifp/...` | `web/content/marketing/about.mdx` (community reference)                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Reddit   | `https://www.reddit.com/r/TechSEO/comments/1rh9jn6/...` | `web/content/marketing/about.mdx` (launch reference)                                                                                                                                                                                                                                                                                                                                                                                                                        |
| LinkedIn | `https://www.linkedin.com/in/tom-raine-hk/`             | `web/content/marketing/ahrefs-alternative.mdx:133` (testimonial)                                                                                                                                                                                                                                                                                                                                                                                                            |

## Open Graph / Social Meta Tags

| Tag                 | Value                             | Location                                    |
| ------------------- | --------------------------------- | ------------------------------------------- |
| `og:title`          | Dynamic (report title)            | `src/server/features/reports/sharePage.tsx` |
| `og:description`    | Dynamic (report description)      | `src/server/features/reports/sharePage.tsx` |
| `og:image`          | Dynamic (report image URL)        | `src/server/features/reports/sharePage.tsx` |
| `og:image:width`    | 1200                              | `src/server/features/reports/sharePage.tsx` |
| `og:image:height`   | 630                               | `src/server/features/reports/sharePage.tsx` |
| `og:image:alt`      | `${report.title} · OpenSEO`       | `src/server/features/reports/sharePage.tsx` |
| `twitter:card`      | summary_large_image               | `src/server/features/reports/sharePage.tsx` |
| `twitter:title`     | Dynamic (report title)            | `src/server/features/reports/sharePage.tsx` |
| `twitter:image`     | Dynamic (report image URL)        | `src/server/features/reports/sharePage.tsx` |
| `twitter:image:alt` | Dynamic                           | `src/server/features/reports/sharePage.tsx` |
| OG image route      | `src/routes/s/$token/og[.]png.ts` | Serves dynamic OG images                    |

## CSS Brand Color Variables

| Variable               | Purpose                       | Locations                                                                                  |
| ---------------------- | ----------------------------- | ------------------------------------------------------------------------------------------ |
| `--color-brand-accent` | Brand accent color            | `web/src/components/campaign-pages.tsx`, `web/src/components/competitor-analysis-tool.tsx` |
| `--color-brand-muted`  | Muted brand text              | `web/src/components/campaign-pages.tsx`, `web/src/components/competitor-analysis-tool.tsx` |
| `--navy`               | Brand navy (test site)        | `tests/badseo/public/styles.css`                                                           |
| `--condensed`          | Brand font family (test site) | `tests/badseo/public/styles.css`                                                           |

## Third-Party Branding References

| Brand                        | Context                               | Locations                                                                             |
| ---------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------- |
| Google (GoogleLogo)          | OAuth login button                    | `src/client/features/auth/AuthPage.tsx:59,76`                                         |
| Google Search Console        | Integration logo                      | `src/client/features/dashboard/DashboardCards.tsx:1` (`GoogleSearchConsoleLogo`)      |
| DataForSEO                   | Provider references in error messages | `src/server/lib/dataforseoBillingClassification.ts`, `src/server/lib/dataforseo/*.ts` |
| Cloudflare                   | Auth mode, Workers                    | `src/middleware/ensure-user/cloudflareAccess.ts`, `src/lib/auth.ts`                   |
| Autumn                       | Billing provider                      | `src/server/billing/autumn.ts`, `src/shared/billing.ts`                               |
| Better Auth                  | Auth library                          | `src/lib/auth.ts`, `src/db/better-auth-schema.ts`                                     |
| Stripe                       | Payment processing                    | `src/serverFunctions/billing.ts`, `src/shared/billing.ts`                             |
| Ahrefs                       | Competitor reference                  | `src/serverFunctions/ahrefs.ts`, `web/content/marketing/ahrefs-alternative.mdx`       |
| Semrush                      | Competitor reference                  | `web/content/marketing/semrush-alternative.mdx`                                       |
| ChatGPT / Anthropic (Claude) | AI providers                          | `src/server/lib/dataforseo/ai.ts`, `src/shared/ai-prompt-suggestions.ts`              |
| OpenRouter                   | LLM provider                          | `src/server/lib/openrouter.ts`                                                        |
| Vellum                       | Referenced in blog                    | `web/content/blogs/how-to-use-vellum-and-openseo-for-seo.md`                          |
| Dub                          | Referral tracking                     | `src/server/referrals/dub.ts`                                                         |
| Loops                        | Email service                         | `src/server/email/loops.ts` (referenced in auth config)                               |
| PostHog                      | Analytics                             | `src/server/lib/posthog.ts`                                                           |
| Turnstile                    | CAPTCHA                               | `src/lib/auth-turnstile.ts`                                                           |
| context.ai (CONTEXT_API_KEY) | JS rendering                          | `src/lib/audit/rendering-billing.ts`                                                  |

## Physical Address (Legal)

| Address                                           | Location                                                |
| ------------------------------------------------- | ------------------------------------------------------- |
| 34 Harding Street, Cambridge, Massachusetts 02141 | `web/content/legal/terms-and-conditions.md:102,129,131` |

## UI Branding Elements

| Element                                   | Location                                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| `transparent-logo.png` reference          | `src/client/components/StatusScreen.tsx:49`                                               |
| `transparent-logo.png` reference          | `src/client/features/onboarding/OnboardingCard.tsx:24`                                    |
| `transparent-logo.png` reference          | `src/client/features/auth/AuthPage.tsx:114`                                               |
| GoogleLogo component                      | `src/client/features/auth/AuthPage.tsx:76`                                                |
| `icon.png` plugin icon                    | `plugins/openseo/assets/icon.png`                                                         |
| `icon.png` reference                      | `plugins/openseo/.claude-plugin/plugin.json`, `plugins/openseo/.codex-plugin/plugin.json` |
| `openseo-fact-sheet.md`                   | `src/server/features/sam/openseo-fact-sheet.md`                                           |
| `samSystemPrompt.ts` (SAM agent branding) | `src/server/features/sam/samSystemPrompt.ts`                                              |
| `openseo-release-notes/SKILL.md`          | `plugins/openseo/skills/openseo-release-notes/SKILL.md`                                   |
| `setup-openseo/SKILL.md`                  | `plugins/openseo/skills/setup-openseo/SKILL.md`                                           |

## Plugin Marketplace Configs

| File                                         | Purpose                                    |
| -------------------------------------------- | ------------------------------------------ |
| `plugins/openseo/.claude-plugin/plugin.json` | Claude plugin manifest                     |
| `plugins/openseo/.codex-plugin/plugin.json`  | Codex plugin manifest                      |
| `plugins/openseo/.cursor-plugin/plugin.json` | Cursor plugin manifest (includes logo URL) |
| `plugins/openseo/.mcp.json`                  | MCP server config                          |
| `.agents/plugins/marketplace.json`           | Agents marketplace                         |
| `.claude-plugin/marketplace.json`            | Claude marketplace                         |
| `.cursor-plugin/marketplace.json`            | Cursor marketplace                         |

## Domain References

| Domain                                            | Context                                            |
| ------------------------------------------------- | -------------------------------------------------- |
| `openseo.so`                                      | Primary product domain (marketing, legal, support) |
| `app.openseo.so`                                  | Hosted app endpoint                                |
| `goodshepherdinsights.com`                        | Error catalog support emails                       |
| `every-app.com` / `github.com/every-app/open-seo` | GitHub org/repo                                    |
