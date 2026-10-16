// Lightweight, dependency-free site reading shared by the chat agents
// (onboarding + SAM): discover URLs from the sitemap (falling back to the
// homepage) and extract readable text from each page via plain fetch. This is
// enough to let the model infer what a site does. JS-heavy sites degrade
// gracefully (less text); a Browser Rendering upgrade can slot in behind this
// same interface later.

import { normalizeAndValidateStartUrl } from "@/server/lib/audit/url-policy";
import { DOMAIN, HOSTED_APP_DOMAIN, SUPPORT_EMAIL, PRICING_URL } from "@/shared/branding";
