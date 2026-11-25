import { Activity, useState, type ReactNode } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { cn } from "cn";
import type { z } from "zod";
import { tabsListVariants } from "@/client/components/ui/tabs";
import type { dashboardSiteTabSchema } from "@/types/schemas/dashboard";

// The kit's tabs redraw every tab and panel several times per click. Here each
// one watches only whether it is the open tab, so a click redraws two of each.

type DashboardTab = z.infer<typeof dashboardSiteTabSchema>;

function useIsOpen(value: DashboardTab) {
  return useSearch({
    from: "/_app/p/$projectId/",
    select: (search) => (search.tab ?? "overview") === value,
  });
}

export function DashboardTabs({ children }: { children: ReactNode }) {
  return (
    <div data-slot="tabs" className="flex flex-col gap-4">
      {children}
    </div>
  );
}

export function DashboardTabList({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      data-slot="tabs-list"
      data-variant="default"
      className={cn(tabsListVariants(), "h-8")}
      onKeyDown={(event) => {
        const tabs = [
          ...event.currentTarget.querySelectorAll<HTMLElement>("[role=tab]"),
        ];
        const current = tabs.findIndex((tab) => tab === event.target);
        const next = {
          ArrowRight: (current + 1) % tabs.length,
          ArrowLeft: (current - 1 + tabs.length) % tabs.length,
          Home: 0,
          End: tabs.length - 1,
        }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        tabs[next].focus();
      }}
    >
      {children}
    </div>
  );
}

export function DashboardTabTrigger({
  value,
  children,
}: {
  value: DashboardTab;
  children: ReactNode;
}) {
  const open = useIsOpen(value);
  const navigate = useNavigate({ from: "/p/$projectId/" });
  return (
    <button
      type="button"
      role="tab"
      id={`dashboard-tab-${value}`}
      aria-selected={open}
      aria-controls={`dashboard-panel-${value}`}
      tabIndex={open ? 0 : -1}
      data-slot="tabs-trigger"
      data-active={open ? "" : undefined}
      className="relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center rounded-md border border-transparent px-3 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/65 transition-all hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring data-active:bg-card data-active:text-foreground data-active:shadow-sm dark:text-muted-foreground dark:hover:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground"
      onClick={() => {
        if (!open) {
          void navigate({ search: { tab: value }, resetScroll: false });
        }
      }}
    >
      {children}
    </button>
  );
}

/**
 * Loads its content the first time it opens, then keeps it: coming back shows
 * the same content without building it again. Hidden content runs no queries.
 */
export function DashboardTabPanel({
  value,
  children,
}: {
  value: DashboardTab;
  children: ReactNode;
}) {
  const open = useIsOpen(value);
  const [opened, setOpened] = useState(open);
  if (open && !opened) setOpened(true);
  return (
    <div
      role="tabpanel"
      id={`dashboard-panel-${value}`}
      aria-labelledby={`dashboard-tab-${value}`}
      tabIndex={0}
      hidden={!open}
      className="min-w-0 flex-1 text-sm outline-none"
    >
      {opened ? (
        <Activity mode={open ? "visible" : "hidden"}>{children}</Activity>
      ) : null}
    </div>
  );
}
