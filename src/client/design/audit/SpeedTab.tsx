import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryState } from "@/client/components/QueryState";
import { sort } from "remeda";
import { isLighthouseFailure } from "@/client/features/audit/results/AuditResultsTableFilterLogic";
import type {
  AuditLighthouseRow,
  AuditResultsData,
} from "@/client/features/audit/results/types";
import { getAuditSpeedCauses } from "@/serverFunctions/auditReport";
import {
  average,
  pagePath,
  plural,
  SPEED_MEASURES,
  type ReportOverview,
} from "./auditReportFormat";
import { speedScope } from "./OverviewView";
import { Section, SpeedGrid, type SpeedCell } from "./parts";
import {
  Choice,
  FilterRange,
  FilterSelect,
  ReportTable,
  TableControls,
  type ReportColumn,
  type SortState,
} from "./ReportTable";

type Field = (typeof SPEED_MEASURES)[number]["field"];
type Device = AuditLighthouseRow["strategy"];

const EMPTY = {
  test: "all" as "all" | "worked" | "failed",
  minScore: "",
  maxScore: "",
  minSeo: "",
  maxSeo: "",
  minLcp: "",
  maxLcp: "",
};

const COLUMNS = SPEED_MEASURES.map(
  (measure): ReportColumn<AuditLighthouseRow, Field> => ({
    label: measure.short,
    sort: measure.field,
    cell: (row) => {
      const value = row[measure.field];
      if (value !== null) return [measure.format(value), measure.tone(value)];
      return measure.field === "performanceScore" && isLighthouseFailure(row)
        ? ["Failed", "bad"]
        : ["–", "muted"];
    },
  }),
);

export function SpeedTab({
  auditRef,
  data,
  testedPages,
  onOpenPage,
}: {
  auditRef: { projectId: string; auditId: string };
  data: AuditResultsData;
  testedPages: ReportOverview["testedPages"];
  onOpenPage: (url: string) => void;
}) {
  const [device, setDevice] = useState<Device>("mobile");
  const [sorting, setSorting] = useState<SortState<Field>>({
    sort: "lcpMs",
    order: "desc",
  });
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const causesQuery = useQuery({
    queryKey: ["audit-speed-causes", auditRef],
    queryFn: () => getAuditSpeedCauses({ data: auditRef }),
  });
  const set = (update: Partial<typeof EMPTY>) =>
    setFilters({ ...filters, ...update });

  const titles = new Map(testedPages.map(({ url, title }) => [url, title]));
  const sub = (row: AuditLighthouseRow) =>
    isLighthouseFailure(row)
      ? (row.errorMessage ?? "The test returned no scores.")
      : (titles.get(row.pageUrl ?? "") ?? "");
  const path = (row: AuditLighthouseRow) =>
    pagePath(row.pageUrl ?? "", data.canonicalHost);
  const tests = data.lighthouse.filter((row) => row.strategy === device);
  const needle = query.trim().toLowerCase();
  const matching = tests.filter(
    (row) =>
      `${path(row)} ${titles.get(row.pageUrl ?? "") ?? ""}`
        .toLowerCase()
        .includes(needle) &&
      (filters.test === "all" ||
        (filters.test === "failed") === isLighthouseFailure(row)) &&
      inRange(row.performanceScore, filters.minScore, filters.maxScore) &&
      inRange(row.seoScore, filters.minSeo, filters.maxSeo) &&
      inRange(
        row.lcpMs === null ? null : row.lcpMs / 1000,
        filters.minLcp,
        filters.maxLcp,
      ),
  );
  // Tests with no value sort last in both directions.
  const rows = sort(matching, (a, b) => {
    const [left, right] = [a[sorting.sort], b[sorting.sort]];
    if (left === null || right === null) {
      return Number(left === null) - Number(right === null);
    }
    return sorting.order === "desc" ? right - left : left - right;
  });

  return (
    <div>
      <Section
        title="Mobile and desktop"
        note={`${speedScope(data)} Scores: 90 and up is good, 50 to 89 needs work, under 50 is poor. Average across the tested pages.`}
      >
        <div className="max-w-[640px]">
          <SpeedGrid
            corner="Average"
            mobile={averages(data.lighthouse, "mobile")}
            desktop={averages(data.lighthouse, "desktop")}
          />
        </div>
      </Section>
      <Section
        title="What slows your pages down"
        note="From the mobile tests, the ones on the most pages first."
      >
        <QueryState
          query={causesQuery}
          errorFallback="Could not load what slows your pages down"
        >
          {({ causes, testedPages: total }) =>
            causes.length === 0 ? (
              <p className="text-muted-foreground">
                {total > 0
                  ? "The mobile tests found nothing to fix."
                  : "The mobile tests saved no details."}
              </p>
            ) : (
              <div>
                {causes.map((cause) => (
                  <div
                    key={cause.key}
                    className="flex min-h-14 items-center gap-3.5 border-t border-border py-2.5 first:border-t-0"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">
                        {plain(cause.title)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {plain(cause.description)}
                      </span>
                    </span>
                    <span className="whitespace-nowrap text-muted-foreground tabular-nums">
                      {cause.pages} of {plural(total, "page")}
                    </span>
                  </div>
                ))}
              </div>
            )
          }
        </QueryState>
      </Section>
      <Section
        title="Each tested page"
        note="Open a page to see what slows it."
      >
        <TableControls
          choice={
            <Choice
              label="Device"
              options={[
                ["mobile", "Mobile"],
                ["desktop", "Desktop"],
              ]}
              value={device}
              onChange={setDevice}
            />
          }
          query={query}
          onQuery={setQuery}
          open={open}
          onToggle={() => setOpen(!open)}
          activeCount={
            Object.values(filters).filter((value) => value && value !== "all")
              .length
          }
          onReset={() => {
            setFilters(EMPTY);
            setQuery("");
          }}
          count={`${rows.length} of ${plural(tests.length, "page")}`}
          filters={
            <>
              <FilterSelect
                label="Test"
                options={[
                  ["all", "All"],
                  ["worked", "Worked"],
                  ["failed", "Failed"],
                ]}
                value={filters.test}
                onChange={(test) => set({ test })}
              />
              <FilterRange
                label="Score"
                min={filters.minScore}
                max={filters.maxScore}
                onMin={(minScore) => set({ minScore })}
                onMax={(maxScore) => set({ maxScore })}
              />
              <FilterRange
                label="SEO"
                min={filters.minSeo}
                max={filters.maxSeo}
                onMin={(minSeo) => set({ minSeo })}
                onMax={(maxSeo) => set({ maxSeo })}
              />
              <FilterRange
                label="Main content (seconds)"
                min={filters.minLcp}
                max={filters.maxLcp}
                onMin={(minLcp) => set({ minLcp })}
                onMax={(maxLcp) => set({ maxLcp })}
              />
            </>
          }
        />
        <ReportTable
          columns={COLUMNS}
          rows={rows}
          rowKey={(row) => row.id}
          path={path}
          sub={sub}
          sorting={sorting}
          onSort={setSorting}
          onOpen={(row) => {
            if (row.pageUrl) onOpenPage(row.pageUrl);
          }}
        />
      </Section>
    </div>
  );
}

function averages(rows: AuditLighthouseRow[], device: Device): SpeedCell {
  const worked = rows.filter(
    (row) => row.strategy === device && !isLighthouseFailure(row),
  );
  if (worked.length === 0) return { values: null, failed: true };
  return {
    failed: false,
    values: {
      performanceScore: average(worked, "performanceScore"),
      accessibilityScore: average(worked, "accessibilityScore"),
      bestPracticesScore: average(worked, "bestPracticesScore"),
      seoScore: average(worked, "seoScore"),
      lcpMs: average(worked, "lcpMs"),
      inpMs: average(worked, "inpMs"),
      cls: average(worked, "cls"),
      ttfbMs: average(worked, "ttfbMs"),
    },
  };
}

/** Lighthouse writes markdown: drop the "Learn more" links and code ticks. */
function plain(text: string) {
  return text
    .replace(/\[[^\]]*\]\([^)]*\)\.?/g, "")
    .replaceAll("`", "")
    .trim();
}

function bound(text: string) {
  const parsed = Number(text);
  return text.trim() && Number.isFinite(parsed) ? parsed : null;
}

function inRange(value: number | null, minText: string, maxText: string) {
  const [min, max] = [bound(minText), bound(maxText)];
  if (min === null && max === null) return true;
  if (value === null) return false;
  return (min === null || value >= min) && (max === null || value <= max);
}
