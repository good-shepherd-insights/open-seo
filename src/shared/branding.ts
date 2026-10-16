/**
 * Centralized branding catalog.
 *
 * Every branding constant lives here. Import from this file instead of
 * hardcoding product names, emails, URLs, or paths.
 *
 * Rules:
 * - Import PRODUCT_NAME for the product name; do not hardcode it in the UI.
 * - Company legal name is "Maryland Insights"
 * - All customer emails are @marylandinsights.com
 * - All URLs use https://
 */

// ── Product Identity ────────────────────────────────────────────────────────

export const PRODUCT_NAME = "Maryland Insights SEO";
// Keep the actual HTTP User-Agent stable so existing WAF allowlists continue to work.
export const CRAWLER_USER_AGENT = "OpenSEO-Audit/1.0";
export const CRAWLER_USER_AGENT_TOKEN = CRAWLER_USER_AGENT.split("/")[0];
export const COMPANY_NAME = "Maryland Insights";
export const PRIMARY_DOMAIN = "marylandinsights.com";
export const SECONDARY_DOMAIN = "seo.marylandinsights.com";
export const DASHBOARD_URL = `https://${SECONDARY_DOMAIN}`;
export const DASHBOARD_MCP_URL = `${DASHBOARD_URL}/mcp`;
// The bundled upstream installer contains this literal and replaces it at copy time.
export const INSTALLER_SOURCE_URL = "https://app.openseo.so";
// External guides and legal pages still live upstream; do not point users at 404s.
export const TERMS_URL = "https://openseo.so/terms-and-conditions";
export const PRIVACY_URL = "https://openseo.so/privacy";
export const UPSTREAM_DOCS_URL = "https://openseo.so/docs";
export const UPSTREAM_SKILLS_NAME = "OpenSEO";
export const CHATGPT_UPDATE_GUIDE_URL = `${UPSTREAM_DOCS_URL}/chatgpt#update-openseo`;
export const GSC_SETUP_GUIDE_URL =
  "https://openseo.so/blogs/google-search-console-setup";

// ── URLs ────────────────────────────────────────────────────────────────────

export const GITHUB_REPO = "https://github.com/every-app/open-seo";
export const PUBLIC_SKILLS_REPO_URL = `${GITHUB_REPO}/tree/main/plugins/openseo/skills`;
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

export const LEGAL_ADDRESS =
  "34 Harding Street, Cambridge, Massachusetts 02141";

// ── Logos ───────────────────────────────────────────────────────────────────

export const LOGO_PATH = "/images/logo.svg";
export const LOGO_ALT = "Maryland Insights";
export const LOGO_HEIGHT_MOBILE = 40;
export const LOGO_HEIGHT_DESKTOP = 64;
// Two successive 15% reductions of the complete lockup.
export const LOGO_SCALE = 0.85 * 0.85;

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
