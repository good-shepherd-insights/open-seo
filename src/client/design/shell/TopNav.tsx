import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/client/components/ui/dropdown-menu";
import { type NavGroup, useNavGroups } from "./useNavGroups";

const tabClass =
  "flex min-h-11 items-center gap-1.5 border-b-2 border-transparent text-[15px] whitespace-nowrap text-muted-foreground outline-none hover:text-foreground focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50";

/** The centered menu under the logo. */
export const TopNav = memo(function TopNav({
  projectId,
  placeholder,
}: {
  projectId: string | null;
  /** The project is not known yet: show the groups without links. */
  placeholder: boolean;
}) {
  const { groups, activePages } = useNavGroups(projectId, placeholder);
  return (
    <nav
      aria-label="Main navigation"
      aria-busy={placeholder || undefined}
      className="-mb-px flex justify-center gap-7"
    >
      {groups.map((group) => (
        <TopNavGroup
          key={group.label}
          group={group}
          activePage={
            group.items.find(({ link }) => activePages.includes(link.to))?.link
              .to
          }
          placeholder={placeholder}
        />
      ))}
    </nav>
  );
});

/** Memoized so moving to another page redraws only the groups it touches. */
const TopNavGroup = memo(function TopNavGroup({
  group: { label, items },
  activePage,
  placeholder,
}: {
  group: NavGroup;
  activePage: string | undefined;
  placeholder: boolean;
}) {
  const className = cn(
    tabClass,
    activePage && "border-primary text-foreground",
  );
  const [only] = items;
  if (placeholder) {
    return (
      <span aria-disabled className={className}>
        {items.length === 1 ? only.name : label}
      </span>
    );
  }
  if (items.length === 1) {
    return (
      <Link {...only.link} className={className}>
        {only.name}
      </Link>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(className, "cursor-pointer")}>
        {label}
        <ChevronDown className="size-3" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto min-w-52 p-1.5">
        {items.map(({ name, link }) => {
          const active = link.to === activePage;
          return (
            <DropdownMenuItem
              key={link.to}
              render={<Link {...link} />}
              aria-current={active ? "page" : undefined}
              className={active ? "text-primary" : undefined}
            >
              {name}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
