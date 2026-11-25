import { DASHBOARD_URL, PRODUCT_NAME } from "@/shared/branding";

// Upstream's skill files, kept as upstream wrote them so merges stay clean.
// Everything that shows them to a user or an agent reads them from here.
const files = import.meta.glob<string>("/.agents/skills/*/SKILL.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** Upstream's name and addresses, replaced with ours. */
export function brandSkillText(text: string) {
  return text
    .replace(
      /https:\/\/openseo\.so\/docs\/skills\/([\w-]+)/g,
      `${DASHBOARD_URL}/skills/$1.md`,
    )
    .replaceAll("https://openseo.so/docs/skills/", `${DASHBOARD_URL}/skills/`)
    .replaceAll("/openseo:", "/")
    .replace(/(?:https:\/\/)?(?:app\.)?openseo\.so/g, DASHBOARD_URL)
    .replace(/\b([Aa])n OpenSEO\b/g, `$1 ${PRODUCT_NAME}`)
    .replace(/\bOpenSEO\b/g, PRODUCT_NAME);
}

export const skillFiles = Object.entries(files).map(([path, raw]) => ({
  path,
  raw: brandSkillText(raw),
}));
