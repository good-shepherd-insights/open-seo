# UI design layer

The product's look lives in `src/client/design/`. Everything else in
`src/client` stays as upstream ships it wherever possible, so upstream merges
stay small.

## Layers

| Layer                                              | Where                                        | Owner    |
| -------------------------------------------------- | -------------------------------------------- | -------- |
| Theme: colors, font, spacing, shared-control look  | `design/theme.css`                           | fork     |
| Shell: header, menus, project switcher placement   | `design/shell/`                              | fork     |
| View: one page's layout, props only                | `design/<page>/*View.tsx`                    | fork     |
| Screen and hook: wires upstream's data to the view | `design/<page>/*Screen.tsx`, `use*Screen.ts` | fork     |
| Controls, data hooks, tables, forms                | `components/`, `features/`                   | upstream |
| Server functions, rules, billing                   | `serverFunctions/`, `server/`                | upstream |

A route renders the fork's screen in place of upstream's page. That one import
and element are the only edits to an upstream route.

## Choosing how to change a page

Take the first that matches the design:

1. Theme only. Leave upstream's page alone.
2. A shared control, restyled in `theme.css` by its `data-slot`.
3. A replaced view that reuses upstream's tables, forms and data hooks.

Do not edit files in `components/ui/` unless `theme.css` cannot do it.

## Rules

- A `*View.tsx` imports no server function, query, or router. Lint enforces it.
- A hook reuses upstream's hook and never repeats its server calls.
- Every replaced page has an entry in `design/replaced.json` naming the original files.
- Colors come from theme variables, never from literals in a view.

## Taking an upstream update

1. Merge upstream into a branch and resolve conflicts. Expect them in routes.
2. `pnpm types:check`: a changed field fails at the screen or hook.
3. `pnpm ui:drift`: lists changed originals of replaced pages. Port each change,
   or decide it does not apply.
4. Set that entry's `reviewed` to the merge commit.
5. Check the changed pages on dev, desktop and phone, light and dark.

Types do not catch a field whose meaning changed, and a new control inside a
replaced page does not appear by itself. Step 3 is what catches both.
