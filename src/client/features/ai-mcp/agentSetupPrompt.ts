import installerSkill from "../../../../.agents/skills/setup-openseo/SKILL.md?raw";
import {
  CHATGPT_UPDATE_GUIDE_URL,
  INSTALLER_SOURCE_URL,
  PRODUCT_NAME,
  PUBLIC_SKILLS_REPO_URL,
  UPSTREAM_DOCS_URL,
  UPSTREAM_SKILLS_NAME,
} from "@/shared/branding";
import updatePrompt from "./agentUpdatePrompt.md?raw";

export const agentUpdatePrompt = updatePrompt
  .trim()
  .replaceAll("{{PRODUCT_NAME}}", PRODUCT_NAME)
  .replaceAll("{{UPSTREAM_DOCS_URL}}", UPSTREAM_DOCS_URL)
  .replaceAll("{{UPSTREAM_SKILLS_NAME}}", UPSTREAM_SKILLS_NAME)
  .replaceAll("{{CHATGPT_UPDATE_GUIDE_URL}}", CHATGPT_UPDATE_GUIDE_URL)
  .replaceAll("{{PUBLIC_SKILLS_REPO_URL}}", PUBLIC_SKILLS_REPO_URL);

// The copyable installer and internal skill share one source of truth.
export function getAgentSetupPrompt(origin: string) {
  const instructions = installerSkill
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
    .trim();
  return instructions.replaceAll(INSTALLER_SOURCE_URL, origin);
}
