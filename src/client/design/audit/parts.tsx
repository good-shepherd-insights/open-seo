import type { ComponentProps, ReactNode } from "react";
import { cn } from "cn";
import { Badge } from "@/client/components/ui/badge";
import { Card } from "@/client/components/ui/card";
import type { IssueSeverity } from "@/shared/audit-issues";
import {
  plural,
  SEVERITY,
  SPEED_MEASURES,
  TONE_CLASS,
  type Tone,
} from "./auditReportFormat";

export function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Card
      role="region"
      aria-label={title}
      className="mb-5 break-inside-avoid gap-3.5 p-5 text-[15px] last:mb-0"
    >
      <div>
        <h2 className="text-lg font-medium">{title}</h2>
        {note ? (
          <p className="mt-1 text-sm text-muted-foreground">{note}</p>
        ) : null}
      </div>
      {children}
    </Card>
  );
}

/** Cards that fill two columns on a wide screen. */
export function TwoColumns({ children }: { children: ReactNode }) {
  return <div className="gap-5 lg:columns-2">{children}</div>;
}

export function RowButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-12 w-full cursor-pointer items-center gap-3.5 border-t border-border py-2 text-left outline-none first:border-t-0 hover:bg-accent/50 focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}

export function SeverityCount({
  severity,
  pages,
}: {
  severity: IssueSeverity;
  pages: number;
}) {
  return (
    <span className="shrink-0 text-right">
      <SeverityChip severity={severity} />
      <span className="block text-sm whitespace-nowrap text-muted-foreground tabular-nums">
        {plural(pages, "page")}
      </span>
    </span>
  );
}

export function SeverityChip({ severity }: { severity: IssueSeverity }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto rounded-md text-[13px] font-normal",
        SEVERITY[severity].className,
      )}
    >
      {SEVERITY[severity].label}
    </Badge>
  );
}

export function Facts({
  rows,
}: {
  rows: Array<[label: string, value: ReactNode, tone?: Tone]>;
}) {
  return (
    <dl>
      {rows.map(([label, value, tone = "ok"]) => (
        <div
          key={label}
          className="flex justify-between gap-4 border-t border-border py-2 first:border-t-0"
        >
          <dt className="max-w-[60%] shrink-0 text-muted-foreground">
            {label}
          </dt>
          <dd className={cn("text-right wrap-anywhere", TONE_CLASS[tone])}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

type SpeedValues = Record<
  (typeof SPEED_MEASURES)[number]["field"],
  number | null
>;

/** Every speed measure, mobile beside desktop. */
export function SpeedGrid({
  mobile,
  desktop,
  corner = "",
}: {
  mobile: SpeedCell;
  desktop: SpeedCell;
  corner?: string;
}) {
  return (
    <table className="w-full tabular-nums">
      <thead className="text-[13px] text-muted-foreground">
        <tr>
          <th className="pb-2 text-left font-normal">{corner}</th>
          <th className="pb-2 pl-5 text-left font-normal">Mobile</th>
          <th className="pb-2 pl-5 text-left font-normal">Desktop</th>
        </tr>
      </thead>
      <tbody>
        {SPEED_MEASURES.map((measure) => (
          <tr key={measure.field} className="border-t border-border">
            <td className="py-2">
              {measure.name}{" "}
              <span className="text-sm text-muted-foreground">
                {measure.hint}
              </span>
            </td>
            {[mobile, desktop].map((cell, index) => {
              const value = cell.values?.[measure.field] ?? null;
              return (
                <td
                  key={index}
                  className={cn(
                    "py-2 pl-5 whitespace-nowrap",
                    TONE_CLASS[
                      value !== null
                        ? measure.tone(value)
                        : cell.failed
                          ? "bad"
                          : "muted"
                    ],
                  )}
                >
                  {value !== null
                    ? measure.format(value)
                    : cell.failed
                      ? "Failed"
                      : "–"}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export type SpeedCell = { values: SpeedValues | null; failed: boolean };
