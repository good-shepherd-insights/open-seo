/**
 * Centralized branding catalog.
 *
 * Every branding constant lives here. Import from this file instead of
 * hardcoding product names, emails, URLs, or paths.
 *
 * Rules:
 * - Product name is always "OpenSEO" (never "openseo" or "openseo.so" in prose)
 * - Company legal name is "Every App, Inc."
 * - Support email for customers is support@openseo.so
 * - Support email in error catalog is support@goodshepherdinsights.com
 * - All URLs use https://
 */

// ── Product Identity ────────────────────────────────────────────────────────

export const PRODUCT_NAME = "OpenSEO";
export const COMPANY_NAME = "Every App, Inc.";
export const PRIMARY_DOMAIN = "openseo.so";
export const HOSTED_APP_DOMAIN = "app.openseo.so";

// ── URLs ────────────────────────────────────────────────────────────────────

export const GITHUB_REPO = "https://github.com/every-app/open-seo";
export const GITHUB_ISSUES_URL = "https://github.com/every-app/open-seo/issues";
export const DISCORD_URL = "https://discord.gg/c9uGs3cFXr";
export const PRICING_URL = "https://openseo.so/pricing";
export const HOSTED_APP_URL = "https://app.openseo.so";
export const MCP_ENDPOINT = "https://app.openseo.so/mcp";
export const DOCS_URL = "https://openseo.so/docs";

// ── Emails ──────────────────────────────────────────────────────────────────

export const SUPPORT_EMAIL = "support@openseo.so";
export const ERROR_SUPPORT_EMAIL = "support@goodshepherdinsights.com";
export const LOCAL_ADMIN_EMAIL = "admin@localhost";

// ── Legal ───────────────────────────────────────────────────────────────────

export const LEGAL_ADDRESS = "34 Harding Street, Cambridge, Massachusetts 02141";

// ── Logos ───────────────────────────────────────────────────────────────────

export const LOGO_PATH = "/transparent-logo.png";
export const LOGO_ALT = `${PRODUCT_NAME}`;
export const PLUGIN_ICON_PATH = "assets/icon.png";
export const PLUGIN_LOGO_URL = "https://raw.githubusercontent.com/every-app/open-seo/main/public/transparent-logo.png";

// ── Social ──────────────────────────────────────────────────────────────────

export const SOCIAL_LINKS = {
  github: GITHUB_REPO,
  discord: DISCORD_URL,
} as const;
