import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryState } from "@/client/components/QueryState";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/client/components/ui/collapsible";
import { Skeleton } from "@/client/components/ui/skeleton";
import { getAuditIssues } from "@/serverFunctions/audit";
import type { IssueSeverity } from "@/shared/audit-issues";
import {
  describeIssue,
  pagePath,
  SEVERITY,
  type Fix,
} from "./auditReportFormat";
import { RowButton, SeverityCount } from "./parts";
import { Choice } from "./ReportTable";

const MAX_PLACES = 100;

type AuditRef = { projectId: string; auditId: string };

export function FixesTab({
  auditRef,
  canonicalHost,
  fixes,
  openType,
  onOpenType,
  onOpenPage,
}: {
  auditRef: AuditRef;
  canonicalHost: string;
  fixes: Fix[];
  openType: string | null;
  onOpenType: (issueType: string | null) => void;
  onOpenPage: (url: string) => void;
}) {
  const [severity, setSeverity] = useState<"all" | IssueSeverity>("all");
  if (fixes.length === 0) {
    return <p className="text-muted-foreground">Nothing to fix.</p>;
  }
  const countOf = (value: IssueSeverity) =>
    fixes.filter((fix) => fix.severity === value).length;
  return (
    <>
      <Choice
        label="Severity"
        value={severity}
        onChange={setSeverity}
        options={[
          ["all", `All (${fixes.length})`],
          ...(["critical", "warning", "info"] as const).map(
            (value): [IssueSeverity, string] => [
              value,
              `${SEVERITY[value].label} (${countOf(value)})`,
            ],
          ),
        ]}
      />
      {fixes
        .filter((fix) => severity === "all" || fix.severity === severity)
        .map((fix) => (
          <Collapsible
            key={fix.issueType}
            className="rounded-xl bg-card text-[15px]"
            open={openType === fix.issueType}
            onOpenChange={(open) => onOpenType(open ? fix.issueType : null)}
          >
            <CollapsibleTrigger className="flex min-h-18 w-full cursor-pointer items-center gap-3.5 rounded-xl px-5 py-3.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{fix.title}</span>
                <span className="text-sm text-muted-foreground">{fix.why}</span>
              </span>
              <SeverityCount severity={fix.severity} pages={fix.pages} />
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-3.5 px-5 pb-5">
              <div>
                <h3 className="font-medium">Why it matters</h3>
                <p className="mt-1 text-muted-foreground">{fix.explanation}</p>
              </div>
              <div>
                <h3 className="font-medium">How to fix it</h3>
                <p className="mt-1 text-muted-foreground">{fix.howToFix}</p>
              </div>
              <div>
                <h3 className="font-medium">Where</h3>
                <Places
                  auditRef={auditRef}
                  canonicalHost={canonicalHost}
                  issueType={fix.issueType}
                  onOpenPage={onOpenPage}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
    </>
  );
}

/** Mounted, and so loaded, only while its fix is open. */
function Places({
  auditRef,
  canonicalHost,
  issueType,
  onOpenPage,
}: {
  auditRef: AuditRef;
  canonicalHost: string;
  issueType: string;
  onOpenPage: (url: string) => void;
}) {
  const query = useQuery({
    queryKey: ["audit-issues", auditRef, issueType],
    queryFn: () =>
      // One extra, to know whether there are more.
      getAuditIssues({
        data: { ...auditRef, issueType, pageSize: MAX_PLACES + 1 },
      }),
  });
  return (
    <QueryState
      query={query}
      loading={<Skeleton className="mt-2 h-4 w-2/3" />}
      errorFallback="Could not load the affected pages"
    >
      {(issues) => (
        <>
          {issues.slice(0, MAX_PLACES).map((issue) => (
            <RowButton
              key={issue.id}
              className="min-h-11 py-1.5 first:border-t"
              onClick={() => onOpenPage(issue.pageUrl)}
            >
              <span className="min-w-0 flex-1 wrap-anywhere">
                {pagePath(issue.pageUrl, canonicalHost)}
                <span className="block text-sm text-foreground/80">
                  {describeIssue(issue, canonicalHost)}
                </span>
              </span>
            </RowButton>
          ))}
          {issues.length > MAX_PLACES ? (
            <p className="text-sm text-muted-foreground">
              These are the first {MAX_PLACES}. Export the fixes for the full
              list.
            </p>
          ) : null}
        </>
      )}
    </QueryState>
  );
}
