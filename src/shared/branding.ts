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
export const CRAWLER_USER_AGENT = "MarylandInsights-Audit/1.0";
export const CRAWLER_USER_AGENT_TOKEN = CRAWLER_USER_AGENT.split("/")[0];
export const COMPANY_NAME = "Maryland Insights";
export const PRIMARY_DOMAIN = "marylandinsights.com";
export const SECONDARY_DOMAIN = "seo.marylandinsights.com";
export const DASHBOARD_URL = `https://${SECONDARY_DOMAIN}`;
export const DASHBOARD_MCP_URL = `${DASHBOARD_URL}/mcp`;
export const TERMS_URL = `${DASHBOARD_URL}/terms`;
export const PRIVACY_URL = `${DASHBOARD_URL}/privacy`;

// ── URLs ────────────────────────────────────────────────────────────────────

// ── Emails ──────────────────────────────────────────────────────────────────

export const SUPPORT_EMAIL = "support@marylandinsights.com";
export const ERROR_SUPPORT_EMAIL = "support@marylandinsights.com";
export const LOCAL_ADMIN_EMAIL = "admin@localhost";

// ── Logos ───────────────────────────────────────────────────────────────────

export const LOGO_PATH = "/images/logo.svg";
export const LOGO_ALT = "Maryland Insights";
export const LOGO_HEIGHT_MOBILE = 40;
export const LOGO_HEIGHT_DESKTOP = 64;
// Two successive 15% reductions of the complete lockup.
export const LOGO_SCALE = 0.85 * 0.85;
