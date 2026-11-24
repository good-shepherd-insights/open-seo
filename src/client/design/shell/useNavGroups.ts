import { useMatchRoute } from "@tanstack/react-router";
import {
  connectNavGroup,
  getProjectNavGroups,
} from "@/client/navigation/items";

/** Upstream's menu list, with the current page marked. */
export function useNavGroups(projectId: string | null, placeholder: boolean) {
  const matchRoute = useMatchRoute();
  const groups =
    projectId !== null || placeholder
      ? getProjectNavGroups(projectId ?? "")
      : [connectNavGroup];
  return groups.map(({ label, items }) => ({
    label,
    items: items.map((item) => {
      const { icon: _icon, label: name, ...link } = item;
      const exact = "activeOptions" in item && item.activeOptions.exact;
      const params = "params" in item ? item.params : {};
      const active =
        !placeholder &&
        (Boolean(matchRoute({ to: item.to, params, fuzzy: !exact })) ||
          // A prompt's history page belongs to Prompt Tracking.
          (item.to === "/p/$projectId/ai-visibility" &&
            Boolean(
              matchRoute({
                to: "/p/$projectId/ai-visibility/prompts/$promptId",
                fuzzy: true,
              }),
            )));
      return { name, link, active };
    }),
  }));
}
