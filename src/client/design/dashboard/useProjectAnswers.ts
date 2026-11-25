import { useMemo } from "react";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { aiVisibilityKey } from "@/client/features/ai-visibility/shared";
import {
  projectContextQueryKey,
  useContextUpdate,
} from "@/client/features/projects/project-context/shared";
import { projectsQueryOptions } from "@/client/features/projects/projectQueries";
import { getProjectContext } from "@/serverFunctions/projectContext";
import { updateProject } from "@/serverFunctions/projects";
import {
  contextChanges,
  settingsChanged,
  type ProjectAnswers,
} from "./projectQuestions";

// Mounting must not restart a failed load: the dashboard waits on loads, so it
// would unmount and mount this again without end.
const contextQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: projectContextQueryKey(projectId),
    queryFn: () => getProjectContext({ data: { projectId } }),
    retryOnMount: false,
  });

/** What the project settings and Context pages hold, and saving it there. */
export function useProjectAnswers(projectId: string) {
  const queryClient = useQueryClient();
  const projects = useQuery({
    ...projectsQueryOptions(),
    retryOnMount: false,
  });
  const context = useQuery(contextQueryOptions(projectId));
  const contextUpdate = useContextUpdate(projectId, { quiet: true });
  const project = projects.data?.find(({ id }) => id === projectId);

  const answers = useMemo((): ProjectAnswers | null => {
    if (!project || !context.data) return null;
    const section = (key: string) =>
      context.data.sections.find((entry) => entry.key === key)?.content ?? "";
    return {
      website: project.domain ?? "",
      market: {
        locationCode: project.locationCode,
        languageCode: project.languageCode,
      },
      business_overview: section("business_overview"),
      current_goal: section("current_goal"),
      positioning: section("positioning"),
      writing_preferences: section("writing_preferences"),
      competitors: context.data.competitors
        .map(({ domain }) => domain)
        .join(", "),
    };
  }, [project, context.data]);

  const save = useMutation({
    mutationFn: async ({
      from,
      to,
    }: {
      from: ProjectAnswers;
      to: ProjectAnswers;
    }) => {
      if (project && settingsChanged(from, to)) {
        await updateProject({
          data: {
            projectId,
            name: project.name,
            // A field left alone keeps what is saved now.
            domain:
              (to.website.trim() === from.website.trim()
                ? project.domain
                : to.website.trim()) || undefined,
            ...(to.market === from.market
              ? {
                  locationCode: project.locationCode,
                  languageCode: project.languageCode,
                }
              : to.market),
          },
        });
        await Promise.all(
          [
            projectsQueryOptions().queryKey,
            ["dashboardActivation", projectId],
            ["dashboardOverview", projectId],
            aiVisibilityKey(projectId),
          ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        );
      }
      const updates = contextChanges(from, to);
      if (updates.length > 0) await contextUpdate.mutateAsync(updates);
    },
    // The form shows the error.
    meta: { errorToast: false },
  });

  return {
    answers,
    save,
    // Stays true through a retry, which clears the error.
    failed:
      !answers && projects.errorUpdateCount + context.errorUpdateCount > 0,
    error: context.error ?? projects.error,
    isRetrying: context.isFetching || projects.isFetching,
    retry: () => {
      if (!context.data) void context.refetch();
      if (!projects.data) void projects.refetch();
    },
  };
}

/** Lets the dashboard wait for the answers, so nothing moves when they land. */
export function useProjectAnswersPending(projectId: string) {
  const projects = useQuery({
    ...projectsQueryOptions(),
    retryOnMount: false,
  });
  const context = useQuery(contextQueryOptions(projectId));
  // Only the first load: a retry keeps the dashboard on screen.
  return [projects, context].some(
    (query) => query.isPending && query.errorUpdateCount === 0,
  );
}
