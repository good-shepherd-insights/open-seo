import { useState, type ReactNode } from "react";
import { Button } from "@/client/components/ui/button";
import { Textarea } from "@/client/components/ui/textarea";

type GetStartedRow = { id: string; title: string; note: string };

/**
 * One step of the strip. Only the field is keyed by the step, so the buttons stay
 * and keep keyboard focus as the steps change.
 */
export function GetStartedStep({
  id,
  title,
  hint,
  field,
  actions,
  skipLabel,
  busy,
  error,
  onSkip,
}: {
  id: string;
  title: string;
  hint: string;
  field?: {
    initial: string;
    /** Enter starts a new line instead of submitting. */
    multiline: boolean;
    placeholder: string;
    maxLength: number;
    submitLabel: string;
    validate: (value: string) => string | undefined;
    onSubmit: (value: string) => void;
  };
  /** Instead of a field. */
  actions?: ReactNode;
  skipLabel: string;
  busy: boolean;
  error?: string;
  onSkip: () => void;
}) {
  const [invalid, setInvalid] = useState<{ id: string; text: string }>();
  const message = invalid?.id === id ? invalid.text : error;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!field) return;
        const entry = new FormData(event.currentTarget).get("answer");
        const value = typeof entry === "string" ? entry.trim() : "";
        const problem = value
          ? field.validate(value)
          : "Write an answer, or skip this one.";
        setInvalid(problem ? { id, text: problem } : undefined);
        if (!problem) field.onSubmit(value);
      }}
    >
      <div className="flex min-h-11 flex-wrap items-center gap-x-7 gap-y-3">
        <div className="min-w-0 flex-[1_1_280px]">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
        {field ? (
          <Textarea
            key={id}
            name="answer"
            aria-label={title}
            aria-invalid={message !== undefined}
            rows={1}
            maxLength={field.maxLength}
            placeholder={field.placeholder}
            defaultValue={field.initial}
            readOnly={busy}
            className="max-h-40 min-h-11 min-w-0 py-[9px] md:py-[11px] placeholder-shown:h-11 placeholder-shown:overflow-hidden placeholder-shown:whitespace-nowrap flex-[2_1_380px] resize-none"
            onChange={() => setInvalid(undefined)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !field.multiline &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
        ) : null}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {field ? (
            <Button type="submit" disabled={busy}>
              {field.submitLabel}
            </Button>
          ) : (
            actions
          )}
          <Button
            type="button"
            variant="ghost"
            className="px-0 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
            disabled={busy}
            onClick={onSkip}
          >
            {skipLabel}
          </Button>
        </div>
      </div>
      {message ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {message}
        </p>
      ) : null}
    </form>
  );
}

export function GetStartedView({
  step,
  place,
  rows,
  onPick,
}: {
  step: ReactNode;
  place: string;
  rows: GetStartedRow[];
  onPick: (id: string) => void;
}) {
  const [all, setAll] = useState(false);
  return (
    <section
      aria-label="Get started"
      className="rounded-xl bg-card px-5 pt-4 pb-2 text-[15px]"
    >
      {step}
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-4 text-sm text-muted-foreground">
        <span>{place}</span>
        <button
          type="button"
          aria-expanded={all}
          className="min-h-11 cursor-pointer hover:text-foreground"
          onClick={() => setAll(!all)}
        >
          {all ? "Hide all" : "Show all"}
        </button>
      </div>
      {all ? (
        <ul className="border-t border-border py-1">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="flex min-h-12 w-full cursor-pointer flex-wrap items-center justify-between gap-x-5 gap-y-0.5 py-1.5 text-left hover:text-primary"
                onClick={() => {
                  setAll(false);
                  onPick(row.id);
                }}
              >
                <span>{row.title}</span>
                <span className="max-w-full truncate text-sm text-muted-foreground sm:max-w-130">
                  {row.note}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
