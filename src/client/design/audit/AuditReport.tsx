import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExportMenu } from "@/client/components/ExportMenu";
import { BackButton, PageHeader } from "@/client/components/PageHeader";
import { QueryState } from "@/client/components/QueryState";
import { Button } from "@/client/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/client/components/ui/tabs";
import {
  exportIssues,
  exportPages,
  exportPerformance,
} from "@/client/features/audit/results/export";
import type { AuditResultsData } from "@/client/features/audit/results/types";
import { useRerunAudit } from "@/client/features/audit/results/useRerunAudit";
import {
  extractHostname,
  formatStartedAt,
} from "@/client/features/audit/shared";
import {
  getAuditReportOverview,
  getAuditReportPages,
} from "@/serverFunctions/auditReport";
import type { AuditReportShow } from "@/types/schemas/auditReport";
import { plural, toFixes } from "./auditReportFormat";
import { FixesTab } from "./FixesTab";
import { OnePage } from "./OnePage";
import { OverviewView } from "./OverviewView";
import { EMPTY_FILTERS, type ReportFilters } from "./pageColumns";
import { PagesTab } from "./PagesTab";
import { ReportNotices } from "./ReportNotices";
import { SpeedTab } from "./SpeedTab";

export type AuditReportTab = "overview" | "issues" | "pages" | "performance";

/** A finished audit. */
export function AuditReport({
  projectId,
  data,
  tab: requestedTab,
  pageUrl,
  onBack,
  onTabChange,
  onOpenPage,
  onClosePage,
}: {
  projectId: string;
  data: AuditResultsData;
  tab: AuditReportTab;
  pageUrl?: string;
  onBack: () => void;
  onTabChange: (tab: AuditReportTab) => void;
  onOpenPage: (url: string) => void;
  onClosePage: () => void;
}) {
  const { audit, lighthouse } = data;
  const auditRef = { projectId, auditId: audit.id };
  const [filters, setFilters] = useState<ReportFilters>(EMPTY_FILTERS);
  const [openFix, setOpenFix] = useState<string | null>(null);
  const overviewQuery = useQuery({
    queryKey: ["audit-report-overview", auditRef],
    queryFn: () => getAuditReportOverview({ data: auditRef }),
  });
  const worstQuery = useQuery({
    queryKey: ["audit-report-worst-pages", auditRef],
    queryFn: () =>
      getAuditReportPages({
        data: { ...auditRef, show: "problems", pageSize: 5 },
      }),
  });
  const rerun = useRerunAudit({
    projectId,
    audit,
    renderJavaScript: audit.config.renderJavaScript === true,
  });

  if (pageUrl) {
    return (
      <OnePage
        auditRef={auditRef}
        data={data}
        url={pageUrl}
        onBack={onClosePage}
      />
    );
  }

  const testedCount = new Set(lighthouse.map((row) => row.pageId)).size;
  const tab =
    requestedTab === "performance" && testedCount === 0
      ? "overview"
      : requestedTab;
  const showPages = (show: AuditReportShow) => {
    setFilters({ ...EMPTY_FILTERS, show });
    onTabChange("pages");
  };
  const showFix = (issueType: string) => {
    setOpenFix(issueType);
    onTabChange("issues");
  };

  return (
    <div className="space-y-6 text-[15px]">
      <PageHeader
        backLink={<BackButton onClick={onBack}>All audits</BackButton>}
        title={extractHostname(audit.startUrl)}
        description={[
          formatStartedAt(audit.startedAt),
          `${plural(data.pageCount, "page")} crawled`,
          ...(testedCount > 0
            ? [`${testedCount} tested for speed on mobile and desktop`]
            : []),
        ].join(" · ")}
        actions={
          <>
            <div className="[&_button]:h-11 [&_button]:px-4 [&_button]:text-sm">
              <ExportMenu
                actions={["sheets", "csv", "json"]}
                onExport={(format) => {
                  if (tab === "performance")
                    exportPerformance(lighthouse, format);
                  else if (tab === "pages") exportPages(auditRef, format);
                  else exportIssues(auditRef, format);
                }}
              />
            </div>
            <Button pending={rerun.isPending} onClick={() => rerun.mutate()}>
              {rerun.isPending ? "Starting…" : "Run again"}
            </Button>
          </>
        }
      />
      <QueryState
        query={overviewQuery}
        errorFallback="Failed to load the audit results"
      >
        {(overview) => {
          const fixes = toFixes(overview.issueTypes);
          const tabs: Array<[AuditReportTab, string]> = [
            ["overview", "Overview"],
            ["issues", `Fixes (${fixes.length})`],
            ["pages", `Pages (${data.pageCount.toLocaleString()})`],
            ...(testedCount > 0
              ? [
                  [
                    "performance",
                    `Speed (${plural(testedCount, "page")})`,
                  ] satisfies [AuditReportTab, string],
                ]
              : []),
          ];
          return (
            <>
              {tab === "overview" ? (
                <ReportNotices
                  projectId={projectId}
                  data={data}
                  overview={overview}
                  onShowUnread={() => showPages("unread")}
                  onShowFix={showFix}
                />
              ) : null}
              <Tabs
                value={tab}
                onValueChange={(value) => {
                  const next = tabs.find(([key]) => key === value);
                  if (next) onTabChange(next[0]);
                }}
                className="border-b border-border"
              >
                <TabsList
                  variant="line"
                  className="h-auto! max-w-full justify-start gap-6 overflow-x-auto p-0 *:flex-none"
                >
                  {tabs.map(([value, label]) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className="min-h-11.5 px-0 text-[15px] font-normal after:bottom-0!"
                    >
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              {tab === "overview" ? (
                <div>
                  <OverviewView
                    data={data}
                    overview={overview}
                    fixes={fixes}
                    worstPages={worstQuery.data?.rows ?? []}
                    onOpenFix={showFix}
                    onAllFixes={() => {
                      setOpenFix(null);
                      onTabChange("issues");
                    }}
                    onShowPages={showPages}
                    onOpenPage={onOpenPage}
                  />
                </div>
              ) : null}
              {tab === "issues" ? (
                <FixesTab
                  auditRef={auditRef}
                  canonicalHost={data.canonicalHost}
                  fixes={fixes}
                  openType={openFix}
                  onOpenType={setOpenFix}
                  onOpenPage={onOpenPage}
                />
              ) : null}
              {tab === "pages" ? (
                <PagesTab
                  auditRef={auditRef}
                  data={data}
                  filters={filters}
                  onFilters={setFilters}
                  onOpenPage={onOpenPage}
                />
              ) : null}
              {tab === "performance" ? (
                <SpeedTab
                  auditRef={auditRef}
                  data={data}
                  testedPages={overview.testedPages}
                  onOpenPage={onOpenPage}
                />
              ) : null}
            </>
          );
        }}
      </QueryState>
    </div>
  );
}
