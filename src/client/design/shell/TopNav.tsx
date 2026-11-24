import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/client/components/ui/dropdown-menu";
import { useNavGroups } from "./useNavGroups";

const tabClass =
  "flex min-h-11 items-center gap-1.5 border-b-2 border-transparent text-[15px] whitespace-nowrap text-muted-foreground outline-none hover:text-foreground focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50";

/** The centered menu under the logo. */
export function TopNav({
  projectId,
  placeholder,
}: {
  projectId: string | null;
  /** The project is not known yet: show the groups without links. */
  placeholder: boolean;
}) {
  const groups = useNavGroups(projectId, placeholder);
  return (
    <nav
      aria-label="Main navigation"
      aria-busy={placeholder || undefined}
      className="-mb-px flex justify-center gap-7"
    >
      {groups.map(({ label, items }) => {
        const className = cn(
          tabClass,
          items.some((item) => item.active) && "border-primary text-foreground",
        );
        const [only] = items;
        if (placeholder) {
          return (
            <span key={label} aria-disabled className={className}>
              {items.length === 1 ? only.name : label}
            </span>
          );
        }
        if (items.length === 1) {
          return (
            <Link key={label} {...only.link} className={className}>
              {only.name}
            </Link>
          );
        }
        return (
          <DropdownMenu key={label}>
            <DropdownMenuTrigger className={cn(className, "cursor-pointer")}>
              {label}
              <ChevronDown className="size-3" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-auto min-w-52 p-1.5">
              {items.map((item) => (
                <DropdownMenuItem
                  key={item.link.to}
                  render={<Link {...item.link} />}
                  aria-current={item.active ? "page" : undefined}
                  className={item.active ? "text-primary" : undefined}
                >
                  {item.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </nav>
  );
}
