import { useId, useState } from "react";
import { useBlocker } from "@tanstack/react-router";
import { ConfirmDialog } from "@/client/components/ConfirmDialog";
import { QueryError } from "@/client/components/QueryState";
import { Button } from "@/client/components/ui/button";
import { Field, FieldLabel } from "@/client/components/ui/field";
import { Input } from "@/client/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/client/components/ui/sheet";
import { Textarea } from "@/client/components/ui/textarea";
import { ProjectMarketFields } from "@/client/features/projects/ProjectMarketFields";
import type { DashboardActivation } from "@/server/features/dashboard/services/DashboardService";
import { NextSteps } from "./NextSteps";
import {
  contextChanges,
  settingsChanged,
  TEXT_QUESTIONS,
  validateAnswer,
  type ProjectAnswers,
} from "./projectQuestions";
import { getProgress } from "./useGetStarted";
import { useProjectAnswers } from "./useProjectAnswers";

/** The header link, and the panel it opens. Give it the project id as `key`. */
export function ProjectDetails({
  projectId,
  activation,
}: {
  projectId: string;
  activation: DashboardActivation;
}) {
  const { answers, save, error, retry, isRetrying } =
    useProjectAnswers(projectId);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [checked, setChecked] = useState(false);
  // From the first change until it is saved, with the answers it started from.
  const [edit, setEdit] = useState<{
    from: ProjectAnswers;
    to: ProjectAnswers;
  } | null>(null);

  const dirty =
    edit !== null &&
    (settingsChanged(edit.from, edit.to) ||
      contextChanges(edit.from, edit.to).length > 0);
  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    enableBeforeUnload: () => dirty,
    withResolver: true,
  });

  const progress = answers ? getProgress(answers, activation) : null;
  const unfinished =
    progress !== null && progress.open.length + progress.todo.length > 0;

  const reset = () => {
    setEdit(null);
    setChecked(false);
    save.reset();
  };
  const close = () => {
    setOpen(false);
    setConfirming(false);
    reset();
  };
  const change = (patch: Partial<ProjectAnswers>) => {
    if (!answers) return;
    const from = edit?.from ?? answers;
    setEdit({ from, to: { ...(edit?.to ?? answers), ...patch } });
    if (save.isSuccess || save.isError) save.reset();
  };

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (next) setOpen(true);
          else if (save.isPending) return;
          else if (dirty) setConfirming(true);
          else close();
        }}
      >
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              className="px-0 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
            />
          }
        >
          {progress && unfinished
            ? `Finish setup, ${progress.done} of ${progress.total}`
            : "Edit project details"}
        </SheetTrigger>
        <SheetContent
          showCloseButton={false}
          className="gap-0 border-border bg-card text-[15px] data-[side=right]:w-full data-[side=right]:sm:max-w-120"
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-3">
            <SheetTitle className="text-lg">Project details</SheetTitle>
            <SheetClose
              render={
                <Button
                  variant="ghost"
                  className="px-0 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
                />
              }
            >
              Close
            </SheetClose>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
            <p className="text-muted-foreground">
              The more you tell us, the better the research, reports and AI
              answers fit your business.
            </p>
            {answers ? (
              <DetailsForm
                value={edit?.to ?? answers}
                busy={save.isPending}
                checked={checked}
                onChange={change}
              />
            ) : (
              <QueryError
                error={error}
                fallback="Failed to load your project details"
                onRetry={retry}
                isRetrying={isRetrying}
              />
            )}
            <NextSteps
              projectId={projectId}
              activation={activation}
              onLeave={() => {
                if (!dirty) close();
              }}
            />
          </div>
          <div className="flex min-h-18 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border px-6 py-3">
            <span role="status" className="text-sm text-muted-foreground">
              {save.isSuccess && !dirty
                ? "Saved to Project settings and Context."
                : null}
              {save.isError ? (
                <span className="text-destructive">
                  Could not save. Try again.
                </span>
              ) : null}
            </span>
            <Button
              disabled={!dirty}
              pending={save.isPending}
              onClick={() => {
                if (!edit) return;
                setChecked(true);
                if (
                  TEXT_QUESTIONS.some(({ id }) =>
                    validateAnswer(id, edit.to[id]),
                  )
                ) {
                  return;
                }
                save.mutate(edit, {
                  onSuccess: () => {
                    setEdit(null);
                    setChecked(false);
                  },
                });
              }}
            >
              Save
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      {confirming || blocker.status === "blocked" ? (
        <ConfirmDialog
          title="Discard your changes?"
          confirmLabel="Discard"
          destructive
          onClose={() => {
            setConfirming(false);
            blocker.reset?.();
          }}
          onConfirm={() => {
            close();
            blocker.proceed?.();
          }}
        >
          What you changed in project details has not been saved.
        </ConfirmDialog>
      ) : null}
    </>
  );
}

function DetailsForm({
  value,
  busy,
  checked,
  onChange,
}: {
  value: ProjectAnswers;
  busy: boolean;
  /** Save was pressed, so what is wrong shows. */
  checked: boolean;
  onChange: (patch: Partial<ProjectAnswers>) => void;
}) {
  const formId = useId();
  return (
    <fieldset disabled={busy} className="flex min-w-0 flex-col gap-6">
      {TEXT_QUESTIONS.map((question) => {
        const id = `${formId}-${question.id}`;
        const problem = checked
          ? validateAnswer(question.id, value[question.id])
          : undefined;
        const control = {
          id,
          value: value[question.id],
          placeholder: question.placeholder,
          maxLength: question.maxLength,
          "aria-invalid": problem !== undefined,
          "aria-describedby": `${id}-hint`,
          onChange: (event: { target: { value: string } }) =>
            onChange({ [question.id]: event.target.value }),
        };
        return (
          <div key={question.id} className="contents">
            <Field>
              <FieldLabel htmlFor={id}>{question.title}</FieldLabel>
              <p id={`${id}-hint`} className="text-sm text-muted-foreground">
                {question.hint}
              </p>
              {question.kind === "line" ? (
                <Input {...control} />
              ) : (
                <Textarea {...control} rows={2} />
              )}
              {problem ? (
                <p role="alert" className="text-sm text-destructive">
                  {problem}
                </p>
              ) : null}
            </Field>
            {question.id === "website" ? (
              <ProjectMarketFields
                value={value.market}
                onChange={(market) => onChange({ market })}
              />
            ) : null}
          </div>
        );
      })}
    </fieldset>
  );
}
