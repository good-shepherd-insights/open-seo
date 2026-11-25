import { useMemo } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import {
  connectNavGroup,
  getProjectNavGroups,
} from "@/client/navigation/items";

/** Upstream's menu list, with the current page marked. */
export function useNavGroups(projectId: string | null, placeholder: boolean) {
  const router = useRouter();
  const groups = useMemo(
    () =>
      (projectId !== null || placeholder
        ? getProjectNavGroups(projectId ?? "")
        : [connectNavGroup]
      ).map(({ label, items }) => ({
        label,
        items: items.map((item) => {
          const { icon: _icon, label: name, ...link } = item;
          return { name, link };
        }),
      })),
    [projectId, placeholder],
  );
  // Selecting the pages, not the location, keeps a tab or filter in the
  // address from re-rendering the menu.
  const activePages = useRouterState({
    select: ({ matches }) =>
      placeholder
        ? ""
        : groups
            .flatMap(({ items }) => items)
            .filter(({ link }) => {
              const exact = "activeOptions" in link && link.activeOptions.exact;
              const params = "params" in link ? link.params : {};
              return (
                router.matchRoute({ to: link.to, params }, { fuzzy: !exact }) ||
                // A prompt's history page belongs to Prompt Tracking.
                (link.to === "/p/$projectId/ai-visibility" &&
                  matches.some(
                    ({ routeId }) =>
                      routeId ===
                      "/_app/p/$projectId/ai-visibility/prompts/$promptId",
                  ))
              );
            })
            .map(({ link }) => link.to)
            .join(" "),
  }).split(" ");
  return { groups, activePages };
}

export type NavGroup = ReturnType<typeof useNavGroups>["groups"][number];
