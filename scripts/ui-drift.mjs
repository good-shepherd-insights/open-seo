// Lists what changed in the originals of screens we replaced since each was
// last reviewed. Run after merging upstream; see docs/maintainers/ui-design.md.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const entries = JSON.parse(
  readFileSync("src/client/design/replaced.json", "utf8"),
);
const since = process.argv[2]; // Override every "reviewed" commit.
let drifted = 0;
for (const { name, ours, upstream, reviewed } of entries) {
  if (!existsSync(ours)) throw new Error(`${name}: ${ours} does not exist`);
  const from = since ?? reviewed;
  const diff = execFileSync(
    "git",
    ["diff", "--stat", `${from}..HEAD`, "--", ...upstream],
    { encoding: "utf8" },
  );
  if (!diff) continue;
  drifted++;
  console.log(`${name}: original changed since ${from}\n${diff}`);
}
console.log(`${drifted} of ${entries.length} replaced screens need review.`);
process.exit(drifted ? 1 : 0);
