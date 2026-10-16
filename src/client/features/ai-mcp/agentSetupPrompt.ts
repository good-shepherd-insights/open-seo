import installerSkill from "../../../../.agents/skills/setup-openseo/SKILL.md?raw";
import { INSTALLER_SOURCE_URL } from "@/shared/branding";
import updatePrompt from "./agentUpdatePrompt.md?raw";

export const agentUpdatePrompt = updatePrompt.trim();

// The copyable installer and internal skill share one source of truth.
export function getAgentSetupPrompt(origin: string) {
  const instructions = installerSkill
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
    .trim();
  return instructions.replaceAll(INSTALLER_SOURCE_URL, origin);
}
