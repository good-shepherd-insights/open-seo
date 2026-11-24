import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { QueryError } from "@/client/components/QueryState";
import {
  parseDomain,
  validateDomain,
} from "@/client/features/dashboard/DashboardSetupAction";
import { captureClientEvent } from "@/client/lib/posthog";
import type { DashboardActivation } from "@/server/features/dashboard/services/DashboardService";
import type { DashboardSetupStep } from "@/types/schemas/dashboard";
import { GetStartedStep, GetStartedView } from "./GetStartedView";
import { StepActions } from "./StepActions";
import { TEXT_QUESTIONS, validateAnswer } from "./projectQuestions";
import {
  getProgress,
  readSkipped,
  useDismissStep,
  writeSkipped,
} from "./useGetStarted";
import { useProjectAnswers } from "./useProjectAnswers";

/** Asks one thing at a time. Give it the project id as `key`. */
export function GetStartedScreen({
  projectId,
  activation,
}: {
  projectId: string;
  activation: DashboardActivation;
}) {
  const { answers, save, failed, error, retry, isRetrying } =
    useProjectAnswers(projectId);
  const dismiss = useDismissStep(projectId);
  const navigate = useNavigate();
  const [skipped, setSkippedState] = useState(() => readSkipped(projectId));
  const [picked, setPicked] = useState<string | null>(null);

  if (!answers) {
    return failed ? (
      <QueryError
        error={error}
        fallback="Failed to load your project details"
        onRetry={retry}
        isRetrying={isRetrying}
      />
    ) : null;
  }

  const setSkipped = (next: string[]) => {
    setSkippedState(next);
    writeSkipped(projectId, next);
  };
  const progress = getProgress(answers, activation);
  const pickedStep = progress.todo.find(({ id }) => id === picked);
  const question =
    TEXT_QUESTIONS.find(({ id }) => id === picked) ??
    (pickedStep
      ? undefined
      : progress.open.find(({ id }) => !skipped.includes(id)));
  const step = question ? undefined : (pickedStep ?? progress.todo[0]);
  // Nothing left to ask. What was skipped waits in the project details panel.
  if (!question && !step) return null;

  const go = (id: DashboardSetupStep, value: string) => {
    captureClientEvent("dashboard:next_move_click", { step: id });
    if (id === "competitor") {
      void navigate({
        to: "/p/$projectId/domain",
        params: { projectId },
        search: { domain: parseDomain(value) },
      });
    } else if (id === "keywords") {
      void navigate({
        to: "/p/$projectId/keywords",
        params: { projectId },
        search: { q: value },
      });
    } else {
      void navigate({
        to: "/p/$projectId/audit",
        params: { projectId },
        search: { url: value },
      });
    }
  };
  const fields: Partial<
    Record<
      DashboardSetupStep,
      { initial: string; placeholder: string; submitLabel: string }
    >
  > = {
    competitor: {
      initial: answers.competitors.split(", ")[0] ?? "",
      placeholder: "competitor.com",
      submitLabel: "Explore competitor",
    },
    keywords: {
      initial: "",
      placeholder: "e.g. running shoes",
      submitLabel: "Get keyword ideas",
    },
    audit: {
      initial: answers.website ? `https://${answers.website}` : "",
      placeholder: "https://example.com",
      submitLabel: "Set up audit",
    },
  };

  const stepNode = question ? (
    <GetStartedStep
      id={question.id}
      title={question.title}
      hint={question.hint}
      field={{
        initial: answers[question.id],
        multiline: question.kind === "prose",
        placeholder: question.placeholder,
        maxLength: question.maxLength,
        submitLabel: "Save",
        validate: (value) => validateAnswer(question.id, value),
        onSubmit: (value) =>
          save.mutate(
            { from: answers, to: { ...answers, [question.id]: value } },
            {
              onSuccess: () => {
                toast.success(`Saved to ${question.keptIn}`);
                setPicked(null);
                setSkipped(skipped.filter((id) => id !== question.id));
              },
            },
          ),
      }}
      skipLabel="Skip"
      busy={save.isPending}
      error={save.isError ? "Could not save. Try again." : undefined}
      onSkip={() => {
        save.reset();
        setPicked(null);
        setSkipped([...new Set([...skipped, question.id])]);
      }}
    />
  ) : step ? (
    <GetStartedStep
      id={step.id}
      title={step.label}
      hint={step.detail}
      field={
        fields[step.id] && {
          ...fields[step.id]!,
          multiline: false,
          maxLength: 255,
          validate: (value) =>
            step.id === "keywords" ? undefined : validateDomain(value),
          onSubmit: (value) => go(step.id, value),
        }
      }
      actions={<StepActions step={step.id} domain={activation.domain} />}
      skipLabel={step.skipLabel}
      busy={dismiss.isPending}
      onSkip={() =>
        dismiss.mutate(
          { step: step.id, dismissed: true },
          { onSuccess: () => setPicked(null) },
        )
      }
    />
  ) : null;

  return (
    <GetStartedView
      step={stepNode}
      place={`Get started, ${progress.done} of ${progress.total} done.${question ? ` This answer is kept in ${question.keptIn}.` : ""}`}
      rows={[
        ...TEXT_QUESTIONS.map(({ id, title }) => ({
          id,
          title,
          note:
            answers[id] || (skipped.includes(id) ? "Skipped" : "Not answered"),
        })),
        ...progress.todo.map(({ id, label }) => ({
          id,
          title: label,
          note: "To do",
        })),
        ...progress.deferred.map(({ id, label }) => ({
          id,
          title: label,
          note: "Saved for later. Restore",
        })),
      ]}
      onPick={(id) => {
        save.reset();
        const deferred = progress.deferred.find((entry) => entry.id === id);
        if (deferred) dismiss.mutate({ step: deferred.id, dismissed: false });
        setPicked(id);
      }}
    />
  );
}
