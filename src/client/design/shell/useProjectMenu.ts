import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { findLast } from "remeda";
import { projectsQueryOptions } from "@/client/features/projects/projectQueries";
import type { ProjectSummary } from "@/client/features/projects/types";
import { setLastProjectId } from "@/client/lib/active-project";
import { LOCATIONS } from "@/shared/keyword-locations";

/** The project list and switching, as upstream's ProjectSwitcher has them. */
export function useProjectMenu(activeProjectId: string | null, ready: boolean) {
  const router = useRouter();
  const query = useQuery({ ...projectsQueryOptions(), enabled: ready });
  const projects = query.data ?? [];

  return {
    isPending: query.isPending,
    projects,
    active: projects.find(({ id }) => id === activeProjectId) ?? null,
    /** Tells apart projects for one domain in several countries. */
    country: (project: ProjectSummary) =>
      project.domain !== null &&
      projects.some(
        (other) =>
          other.domain === project.domain &&
          other.locationCode !== project.locationCode,
      )
        ? LOCATIONS[project.locationCode]
        : undefined,
    select: (project: ProjectSummary) => {
      if (project.id === activeProjectId) return;
      setLastProjectId(project.id);
      // Keep the section when it exists in the new project. Detail pages
      // belong to the old project and fall back to their section.
      const stayable = findLast(
        router.state.matches,
        (match) =>
          match.fullPath.includes("$projectId") &&
          match.fullPath
            .split("/")
            .every(
              (segment) => !segment.startsWith("$") || segment === "$projectId",
            ),
      );
      const template = stayable?.fullPath ?? "/p/$projectId";
      void router.navigate({
        href: template.split("$projectId").join(project.id).replace(/\/$/, ""),
      });
    },
  };
}
