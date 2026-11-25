import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStepStatus,
  getVisibleSteps,
} from "@/client/features/dashboard/dashboardSteps";
import { captureClientEvent } from "@/client/lib/posthog";
import { usesBetterAuthClient } from "@/lib/auth-mode";
import type { DashboardActivation } from "@/server/features/dashboard/services/DashboardService";
import { setDashboardStepDismissed } from "@/serverFunctions/dashboard";
import type { DashboardSetupStep } from "@/types/schemas/dashboard";
import { TEXT_QUESTIONS, type ProjectAnswers } from "./projectQuestions";

/** How far setup is: the questions, then upstream's steps. */
export function getProgress(
  answers: ProjectAnswers,
  activation: DashboardActivation,
) {
  const steps = getVisibleSteps(activation, usesBetterAuthClient());
  const withStatus = (status: ReturnType<typeof getStepStatus>) =>
    steps.filter((step) => getStepStatus(activation, step.id) === status);
  const open = TEXT_QUESTIONS.filter(({ id }) => !answers[id].trim());
  const todo = withStatus("todo");
  const deferred = withStatus("skipped");
  // The country is the one more question, always answered.
  const total = TEXT_QUESTIONS.length + 1 + steps.length;
  return {
    open,
    todo,
    deferred,
    completed: withStatus("done"),
    total,
    done: total - open.length - todo.length - deferred.length,
  };
}

export function useDismissStep(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { step: DashboardSetupStep; dismissed: boolean }) =>
      setDashboardStepDismissed({ data: { projectId, ...input } }),
    onSuccess: async (_, input) => {
      await queryClient.invalidateQueries({
        queryKey: ["dashboardActivation", projectId],
      });
      captureClientEvent("dashboard:setup_step_defer", input);
    },
  });
}

const skippedKey = (projectId: string) => `getStarted:skipped:${projectId}`;

export function readSkipped(projectId: string): string[] {
  try {
    return (localStorage.getItem(skippedKey(projectId)) ?? "")
      .split(",")
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function writeSkipped(projectId: string, skipped: string[]) {
  try {
    localStorage.setItem(skippedKey(projectId), skipped.join(","));
  } catch {
    // Without storage the skip holds until the page reloads.
  }
}
