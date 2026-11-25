import { PRODUCT_NAME } from "@/shared/branding";
import setupPrompt from "./agentSetupPrompt.md?raw";

const fill = (text: string, origin: string) =>
  text
    .trim()
    .replaceAll("{{PRODUCT_NAME}}", PRODUCT_NAME)
    .replaceAll("{{ORIGIN}}", origin);

export function getAgentSetupPrompt(origin: string) {
  return fill(setupPrompt, origin);
}

/** Short enough to travel in a new-chat link. */
export function getAgentConnectPrompt(origin: string) {
  return `Help me connect ${PRODUCT_NAME} to this chat app. Its remote MCP server is ${origin}/mcp and signs in with OAuth. Give me the exact steps to add it as a custom connector, then have me ask you to list my projects.`;
}

export function getAgentUpdatePrompt(origin: string) {
  return `Update my installed ${PRODUCT_NAME} skills. The current list is at ${origin}/skills/index.md, and each entry links to the latest version. Update only these skills, in the place they are installed now. Keep my MCP connection, sign-in and personal edits, and ask before replacing an edit that conflicts. Then tell me what changed and whether I need to reload.`;
}
