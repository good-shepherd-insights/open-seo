import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const roots = ["src/client", "src/routes/_app"];
const authRoutes = [
  "src/routes/_auth.sign-in.tsx",
  "src/routes/_auth.sign-up.tsx",
  "src/routes/auth-error.tsx",
  "src/routes/accept-invitation.$id.tsx",
];

function filesIn(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const name = join(path, entry.name);
    if (entry.isDirectory()) return filesIn(name);
    return /\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts") ? [name] : [];
  });
}

describe("dashboard branding", () => {
  it("has no hardcoded product identity or obsolete logo in dashboard and auth UI", () => {
    const offenders = [...roots.flatMap(filesIn), ...authRoutes].flatMap(
      (file) => {
        const text = readFileSync(file, "utf8");
        return text
          .split("\n")
          .flatMap((line, index) =>
            /OpenSEO|openseo\.so|transparent-logo\.png/.test(line) &&
            !line.includes('"OpenSEO-Audit" crawler')
              ? [`${relative(process.cwd(), file)}:${index + 1}`]
              : [],
          );
      },
    );
    expect(offenders).toEqual([]);
  });
});
