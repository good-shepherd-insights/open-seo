# SOP: Development Rules

## Branch and PR Rules

1. **Always use PRs** — branch, commit, push, open PR. Never commit directly without a PR.
2. **One branch → one PR.** Never create duplicate PRs. If a second PR is needed, close the first and consolidate.
3. **Never merge main into local without explicit user permission.** User must authorize first.
4. **Branch name: `local`** — all work goes on a branch called `local`, not feature branches.

## Code Rules

5. **Never write Chinese in code or user-facing text.** All output in English.
6. **Error messages must be user-friendly:**
   - Plain language, no jargon, no ALL CAPS
   - No provider names (e.g., DataForSEO, Google)
   - No env var names or secrets
   - If the user can't fix it themselves, include `support@goodshepherdinsights.com`
7. **All errors go in `src/shared/errors.ts`** — centralized catalog, imported everywhere.

## Merge Conflict Rules

8. When merging main into local:
   - Keep both sides' changes when they're complementary
   - Keep the more specific error message
   - Keep centralized error defs over hardcoded ones
   - Run typecheck after resolving
