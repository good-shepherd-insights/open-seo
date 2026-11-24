import { Link, useMatchRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/client/components/ui/dropdown-menu";
import {
  connectNavGroup,
  getProjectNavGroups,
} from "@/client/navigation/items";

const tabClass =
  "flex min-h-11 items-center gap-2 border-b-2 border-transparent text-[15px] whitespace-nowrap text-muted-foreground outline-none hover:text-foreground focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50";
const activeTabClass = "border-primary font-medium text-foreground";

/** The grouped menu, from the same list as the phone menu. */
export function TopNav({
  projectId,
  placeholder,
}: {
  projectId: string | null;
  /** The project is not known yet: show the groups without links. */
  placeholder: boolean;
}) {
  const matchRoute = useMatchRoute();
  const groups =
    projectId !== null || placeholder
      ? getProjectNavGroups(projectId ?? "")
      : [connectNavGroup];
  const isActive = (item: (typeof groups)[number]["items"][number]) => {
    if (placeholder) return false;
    const exact = "activeOptions" in item && item.activeOptions.exact;
    const params = "params" in item ? item.params : {};
    if (matchRoute({ to: item.to, params, fuzzy: !exact })) return true;
    // A prompt's history page belongs to Prompt Tracking.
    return (
      item.to === "/p/$projectId/ai-visibility" &&
      Boolean(
        matchRoute({
          to: "/p/$projectId/ai-visibility/prompts/$promptId",
          fuzzy: true,
        }),
      )
    );
  };

  return (
    <nav
      aria-label="Main navigation"
      aria-busy={placeholder || undefined}
      className="flex flex-wrap gap-x-7"
    >
      {groups.map((group) => {
        const active = group.items.some(isActive);
        const [only] = group.items;
        if (placeholder) {
          return (
            <span key={group.label} aria-disabled className={tabClass}>
              {group.items.length === 1 ? only.label : group.label}
            </span>
          );
        }
        if (group.items.length === 1) {
          const { icon: _icon, label, ...link } = only;
          return (
            <Link
              key={group.label}
              {...link}
              className={cn(tabClass, active && activeTabClass)}
            >
              {label}
            </Link>
          );
        }
        return (
          <DropdownMenu key={group.label}>
            <DropdownMenuTrigger
              className={cn(
                tabClass,
                "cursor-pointer",
                active && activeTabClass,
              )}
            >
              {group.label}
              <ChevronDown className="size-3.5" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 p-1.5">
              {group.items.map((item) => {
                const { icon: _icon, label, ...link } = item;
                const current = isActive(item);
                return (
                  <DropdownMenuItem
                    key={item.to}
                    render={<Link {...link} />}
                    aria-current={current ? "page" : undefined}
                    className={current ? "font-medium text-primary" : undefined}
                  >
                    {label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </nav>
  );
}
