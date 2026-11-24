import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/client/components/ui/combobox";
import { Separator } from "@/client/components/ui/separator";
import { Skeleton } from "@/client/components/ui/skeleton";
import { CreateProjectModal } from "@/client/features/projects/CreateProjectModal";
import type { ProjectSummary } from "@/client/features/projects/types";
import { useProjectMenu } from "./useProjectMenu";

const SEARCH_THRESHOLD = 8;

const linkClass =
  "flex min-h-11 w-full cursor-pointer items-center rounded-lg px-2.5 text-left text-[15px] outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50";

function matches(project: ProjectSummary, query: string) {
  return `${project.name} ${project.domain ?? ""}`
    .toLowerCase()
    .includes(query.trim().toLowerCase());
}

export function ProjectMenu({
  projectId,
  ready,
  boxed = false,
  onNavigate,
}: {
  projectId: string | null;
  ready: boolean;
  /** The phone menu's full-width button. */
  boxed?: boolean;
  onNavigate?: () => void;
}) {
  const menu = useProjectMenu(projectId, ready);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const searchable = menu.projects.length >= SEARCH_THRESHOLD;
  const leave = () => {
    setOpen(false);
    onNavigate?.();
  };

  if (menu.isPending) {
    return (
      <div className="flex min-h-11 items-center" aria-busy>
        <Skeleton className="h-4 w-28" />
      </div>
    );
  }
  return (
    <>
      <Combobox
        items={menu.projects}
        value={menu.active}
        itemToStringLabel={(project) => project.name}
        isItemEqualToValue={(project, value) => project.id === value.id}
        filter={searchable ? matches : null}
        autoHighlight
        open={open}
        onOpenChange={setOpen}
        onValueChange={(project) => {
          if (!project) return;
          leave();
          menu.select(project);
        }}
      >
        <ComboboxTrigger
          aria-label={`Switch project, ${menu.active?.name ?? "none selected"}`}
          className={cn(
            "flex cursor-pointer items-center gap-2 text-left text-[15px] outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50 [&>svg]:size-3 [&>svg]:shrink-0",
            boxed
              ? "min-h-14 w-full justify-between rounded-lg border border-input bg-card px-3.5 py-2"
              : "min-h-11 max-w-full text-muted-foreground hover:text-foreground",
          )}
        >
          <span className="min-w-0">
            <span className="block truncate">
              {menu.active?.name ?? "Select project"}
            </span>
            {boxed && menu.active?.domain ? (
              <span className="block truncate text-[13px] text-muted-foreground">
                {menu.active.domain}
              </span>
            ) : null}
          </span>
        </ComboboxTrigger>
        <ComboboxContent className={boxed ? undefined : "w-75 min-w-75"}>
          {searchable ? (
            <ComboboxInput
              className="w-auto"
              placeholder="Find project…"
              aria-label="Filter projects"
              showTrigger={false}
            />
          ) : null}
          {menu.projects.length > 0 ? (
            <ComboboxEmpty>No projects match.</ComboboxEmpty>
          ) : null}
          <ComboboxList className="max-h-[min(50vh,21rem)] p-1.5">
            {(project: ProjectSummary) => (
              <ComboboxItem key={project.id} value={project}>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{project.name}</span>
                  {project.domain ? (
                    <span className="truncate text-[13px] text-muted-foreground">
                      {project.domain}
                    </span>
                  ) : null}
                </span>
                {menu.country(project) ? (
                  <span className="ml-auto shrink-0 text-[13px] text-muted-foreground">
                    {menu.country(project)}
                  </span>
                ) : null}
              </ComboboxItem>
            )}
          </ComboboxList>
          <Separator />
          <div className="p-1.5">
            {menu.active ? (
              <Link
                to="/p/$projectId/settings"
                params={{ projectId: menu.active.id }}
                className={linkClass}
                onClick={leave}
              >
                Project settings
              </Link>
            ) : null}
            <button
              type="button"
              className={linkClass}
              onClick={() => {
                setOpen(false);
                setCreating(true);
              }}
            >
              New project
            </button>
            <Link to="/projects" className={linkClass} onClick={leave}>
              Manage projects
            </Link>
          </div>
        </ComboboxContent>
      </Combobox>
      {creating ? (
        <CreateProjectModal
          onClose={() => {
            setCreating(false);
            onNavigate?.();
          }}
        />
      ) : null}
    </>
  );
}
