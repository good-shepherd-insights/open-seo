import { createFileRoute } from "@tanstack/react-router";
import { parseSkill } from "@/server/features/sam/samSkills";
import { skillFiles } from "@/server/features/skills/publicSkills";
import { DASHBOARD_URL, PRODUCT_NAME } from "@/shared/branding";

// The skills as plain files an agent can read and install: /skills/index.md
// lists them, /skills/<name>.md is each one.
function skillResponse(file: string) {
  const skills = skillFiles.flatMap(({ path, raw }) => {
    const skill = parseSkill(path, raw);
    return skill ? [{ ...skill, raw }] : [];
  });
  const name = file.replace(/\.md$/, "");
  const text =
    name === "index"
      ? `# ${PRODUCT_NAME} skills\n\n${skills.map((skill) => `- [${skill.name}](${DASHBOARD_URL}/skills/${skill.name}.md): ${skill.description}`).join("\n")}\n`
      : skills.find((skill) => skill.name === name)?.raw;
  return new Response(text ?? "Not found", {
    status: text === undefined ? 404 : 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

export const Route = createFileRoute("/skills/$name")({
  server: { handlers: { GET: ({ params }) => skillResponse(params.name) } },
});
