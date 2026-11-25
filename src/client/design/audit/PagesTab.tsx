import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QueryState } from "@/client/components/QueryState";
import { TablePagination } from "@/client/components/table/TablePagination";
import { Card } from "@/client/components/ui/card";
import { countActiveFilters } from "@/client/features/audit/results/AuditResultsTableFilters";
import {
  isLighthouseFailure,
  toPagesQuery,
} from "@/client/features/audit/results/AuditResultsTableFilterLogic";
import type {
  AuditLighthouseRow,
  AuditResultsData,
} from "@/client/features/audit/results/types";
import { useDebouncedDraft } from "@/client/hooks/useDebouncedDraft";
import { getAuditReportPages } from "@/serverFunctions/auditReport";
import type { AuditReportSort } from "@/types/schemas/auditReport";
import { pagePath, type ReportPage } from "./auditReportFormat";
import {
  CRAWL_RESULT_OPTIONS,
  EMPTY_FILTERS,
  PAGE_VIEWS,
  pageColumns,
  SHOW_OPTIONS,
  type PageView,
  type ReportFilters,
} from "./pageColumns";
import {
  Choice,
  FilterRange,
  FilterSelect,
  ReportTable,
  TableControls,
  type SortState,
} from "./ReportTable";

const PAGE_SIZE = 100;

/**
 * Filtering, sorting and paging run in the database: a 10,000-page audit is
 * too big to send to the browser in one response.
 */
export function PagesTab({
  auditRef,
  data,
  filters,
  onFilters,
  onOpenPage,
}: {
  auditRef: { projectId: string; auditId: string };
  data: AuditResultsData;
  filters: ReportFilters;
  onFilters: (filters: ReportFilters) => void;
  onOpenPage: (url: string) => void;
}) {
  const [view, setView] = useState<PageView>("Main");
  const [sorting, setSorting] = useState<SortState<AuditReportSort>>({
    sort: "problems",
    order: "desc",
  });
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useDebouncedDraft(filters, (next) => {
    onFilters(next);
    setPage(1);
  });
  const { show, ...rest } = filters;
  const query = useQuery({
    queryKey: ["audit-report-pages", auditRef, filters, sorting, page],
    queryFn: () =>
      getAuditReportPages({
        data: {
          ...auditRef,
          ...toPagesQuery(rest),
          ...sorting,
          show,
          page,
          pageSize: PAGE_SIZE,
        },
      }),
    placeholderData: keepPreviousData,
  });
  const set = (update: Partial<ReportFilters>) =>
    setDraft({ ...draft, ...update });
  const speedOf = (
    row: ReportPage,
    strategy: AuditLighthouseRow["strategy"],
  ) => {
    const result = data.lighthouse.find(
      (test) => test.pageId === row.id && test.strategy === strategy,
    );
    if (!result) return null;
    return isLighthouseFailure(result) ? "failed" : result.performanceScore;
  };

  return (
    <Card className="gap-3.5 p-5 text-[15px]">
      <TableControls
        choice={
          <Choice
            label="Columns"
            options={PAGE_VIEWS.map((name) => [name, name])}
            value={view}
            onChange={(next) => {
              setView(next);
              setSorting({ sort: "problems", order: "desc" });
              setPage(1);
            }}
          />
        }
        query={draft.query}
        onQuery={(text) => set({ query: text })}
        open={open}
        onToggle={() => setOpen(!open)}
        activeCount={countActiveFilters({ ...draft, query: "" }, EMPTY_FILTERS)}
        onReset={() => setDraft(EMPTY_FILTERS)}
        count={
          query.data
            ? `${query.data.totalCount.toLocaleString()} of ${data.pageCount.toLocaleString()} pages`
            : ""
        }
        filters={
          <>
            <FilterSelect
              label="Show"
              options={SHOW_OPTIONS}
              value={draft.show}
              onChange={(next) => set({ show: next })}
            />
            <FilterSelect
              label="Status"
              options={[
                ["all", "All"],
                ["ok", "2xx"],
                ["redirect", "3xx"],
                ["error", "4xx/5xx"],
                ["missing", "Missing"],
              ]}
              value={draft.status}
              onChange={(status) => set({ status })}
            />
            <FilterSelect
              label="Crawl result"
              options={CRAWL_RESULT_OPTIONS}
              value={draft.fetchClass}
              onChange={(fetchClass) => set({ fetchClass })}
            />
            <FilterSelect
              label="Alt text"
              options={[
                ["all", "All"],
                ["yes", "Missing alt"],
                ["no", "No missing alt"],
              ]}
              value={draft.missingAlt}
              onChange={(missingAlt) => set({ missingAlt })}
            />
            <FilterRange
              label="Words"
              min={draft.minWords}
              max={draft.maxWords}
              onMin={(minWords) => set({ minWords })}
              onMax={(maxWords) => set({ maxWords })}
            />
            <FilterRange
              label="Answer time (ms)"
              min={draft.minResponseMs}
              max={draft.maxResponseMs}
              onMin={(minResponseMs) => set({ minResponseMs })}
              onMax={(maxResponseMs) => set({ maxResponseMs })}
            />
          </>
        }
      />
      <QueryState query={query} errorFallback="Could not load the pages">
        {(result) => (
          <>
            <ReportTable
              columns={pageColumns(view, speedOf)}
              rows={result.rows}
              rowKey={(row) => row.id}
              path={(row) => pagePath(row.url, data.canonicalHost)}
              sub={(row) =>
                row.redirectUrl
                  ? `Redirects to ${pagePath(row.redirectUrl, data.canonicalHost)}`
                  : row.title || (row.isAnalyzed ? "No title" : "")
              }
              sorting={sorting}
              onSort={(next) => {
                setSorting(next);
                setPage(1);
              }}
              onOpen={(row) => onOpenPage(row.url)}
            />
            {result.totalCount > PAGE_SIZE ? (
              <TablePagination
                page={page}
                pageSize={PAGE_SIZE}
                totalCount={result.totalCount}
                isLoading={query.isFetching}
                onPageChange={setPage}
              />
            ) : null}
          </>
        )}
      </QueryState>
    </Card>
  );
}
