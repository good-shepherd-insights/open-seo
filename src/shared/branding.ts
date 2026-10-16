/**
 * Centralized branding catalog.
 *
 * Every branding constant lives here. Import from this file instead of
 * hardcoding product names, emails, URLs, or paths.
 *
 * Rules:
 * - Product name is always "OpenSEO" (never "openseo" or "openseo.so" in prose)
 * - Company legal name is "Maryland Insights"
 * - All customer emails are @marylandinsights.com
 * - All URLs use https://
 */

// ── Product Identity ────────────────────────────────────────────────────────

export const PRODUCT_NAME = "Maryland Insights SEO";
export const COMPANY_NAME = "Maryland Insights";
export const PRIMARY_DOMAIN = "marylandinsights.com";
export const SECONDARY_DOMAIN = "seo.marylandinsights.com";

// ── URLs ────────────────────────────────────────────────────────────────────

export const GITHUB_REPO = "https://github.com/every-app/open-seo";
export const GITHUB_ISSUES_URL = "https://github.com/every-app/open-seo/issues";
export const PRICING_URL = "https://marylandinsights.com/pricing";
export const HOSTED_APP_URL = "https://app.marylandinsights.com";
export const MCP_ENDPOINT = "https://seomarylandinsights.com/mcp";
export const DOCS_URL = "https://marylandinsights.com/docs";

// ── Emails ──────────────────────────────────────────────────────────────────

export const SUPPORT_EMAIL = "support@marylandinsights.com";
export const ERROR_SUPPORT_EMAIL = "support@marylandinsights.com";
export const LOCAL_ADMIN_EMAIL = "admin@localhost";

// ── Legal ───────────────────────────────────────────────────────────────────

export const LEGAL_ADDRESS = "34 Harding Street, Cambridge, Massachusetts 02141";

// ── Logos ───────────────────────────────────────────────────────────────────

export const LOGO_PATH = "/images/logo.svg";
export const LOGO_ALT = "Maryland Insights";

// ── Social ──────────────────────────────────────────────────────────────────

export const SOCIAL_LINKS = {
  github: GITHUB_REPO,
} as const;

// ── Domain variations ───────────────────────────────────────────────────────

export const DOMAIN = "marylandinsights.com";
export const DOMAIN_WWW = "www.marylandinsights.com";
export const GITHUB_ORG = "every-app";
export const MESSAGING_URL = "https://app.marylandinsights.com";
export const ADMINS_URL = "https://docs.marylandinsights.com";
export const PLUGIN_SERVER_URL = "https://seomarylandinsights.com/mcp";
export const AGENT_SETUP_URL = "https://app.marylandinsights.com";
export const SOCIAL_CARD_URL = "https://marylandinsights.com/social-card.jpg";
export const OGP_IMAGE_URL = "https://marylandinsights.com/social-card.jpg";
