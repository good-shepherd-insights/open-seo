import { sortBy } from "remeda";
import { cn } from "cn";
import { Button } from "@/client/components/ui/button";
import { isLighthouseFailure } from "@/client/features/audit/results/AuditResultsTableFilterLogic";
import type { AuditResultsData } from "@/client/features/audit/results/types";
import { formatDate, formatStartedAt } from "@/client/features/audit/shared";
import { getIssueDescriptor } from "@/shared/audit-issues";
import type { AuditReportShow } from "@/types/schemas/auditReport";
import {
  average,
  pagePath,
  plural,
  SCORE_WORD,
  SPEED_MEASURES,
  TONE_CLASS,
  type Fix,
  type ReportOverview,
  type ReportPage,
  type Tone,
} from "./auditReportFormat";
import { Facts, RowButton, Section, SeverityCount, TwoColumns } from "./parts";

const HEALTH: Array<
  [key: keyof NonNullable<ReportOverview["health"]>, label: string, tone: Tone]
> = [
  ["unusable", "Search engines can’t use", "bad"],
  ["not-in-sitemap", "Not in the sitemap", "warn"],
  ["no-description", "No meta description", "warn"],
  ["no-structured-data", "No structured data", "ok"],
  ["no-share-image", "No social preview image", "ok"],
  ["redirects", "Redirects", "ok"],
  ["unread", "Couldn’t be read", "warn"],
];

export function OverviewView({
  data,
  overview,
  fixes,
  worstPages,
  onOpenFix,
  onAllFixes,
  onShowPages,
  onOpenPage,
}: {
  data: AuditResultsData;
  overview: ReportOverview;
  fixes: Fix[];
  worstPages: ReportPage[];
  onOpenFix: (issueType: string) => void;
  onAllFixes: () => void;
  onShowPages: (show: AuditReportShow) => void;
  onOpenPage: (url: string) => void;
}) {
  const { canonicalHost } = data;
  return (
    <>
      {fixes.length === 0 ? (
        <Section title="Nothing to fix">
          <p className="text-muted-foreground">
            Every check passed on every page we read.
          </p>
        </Section>
      ) : (
        <Section
          title="Fix these first"
          note="Most serious first, then the ones on the most pages."
        >
          <div>
            {fixes.slice(0, 5).map((fix, index) => (
              <RowButton
                key={fix.issueType}
                className="min-h-14 py-2.5"
                onClick={() => onOpenFix(fix.issueType)}
              >
                <span className="w-4.5 shrink-0 text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{fix.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {fix.why}
                  </span>
                </span>
                <SeverityCount severity={fix.severity} pages={fix.pages} />
              </RowButton>
            ))}
          </div>
          <Button variant="outline" className="self-start" onClick={onAllFixes}>
            {fixes.length === 1
              ? "See the fix"
              : `See all ${fixes.length} fixes`}
          </Button>
        </Section>
      )}
      <TwoColumns>
        <Changes changes={overview.changes} canonicalHost={canonicalHost} />
        <Speed data={data} onOpenPage={onOpenPage} />
        <Section
          title="Can search engines use your pages?"
          note={`${plural(data.pageCount, "page")} crawled. Press a line to see those pages.`}
        >
          <div>
            {HEALTH.map(([key, label, tone]) => {
              const count = overview.health?.[key] ?? 0;
              return (
                <RowButton key={key} onClick={() => onShowPages(key)}>
                  <span className="min-w-0 flex-1">{label}</span>
                  <span
                    className={cn(
                      "tabular-nums",
                      TONE_CLASS[count ? tone : "good"],
                    )}
                  >
                    {count.toLocaleString()}
                  </span>
                </RowButton>
              );
            })}
          </div>
        </Section>
        {worstPages.length > 0 ? (
          <Section
            title="Pages with the most problems"
            note="Open a page to see everything found on it."
          >
            <div>
              {worstPages.map((page) => (
                <RowButton key={page.id} onClick={() => onOpenPage(page.url)}>
                  <span className="min-w-0 flex-1 wrap-anywhere">
                    {pagePath(page.url, canonicalHost)}
                  </span>
                  <span
                    className={cn(
                      "whitespace-nowrap tabular-nums",
                      TONE_CLASS[page.hasSerious ? "bad" : "ok"],
                    )}
                  >
                    {plural(page.problemCount, "problem")}
                  </span>
                </RowButton>
              ))}
            </div>
          </Section>
        ) : null}
        <About data={data} />
      </TwoColumns>
    </>
  );
}

function Changes({
  changes,
  canonicalHost,
}: {
  changes: ReportOverview["changes"];
  canonicalHost: string;
}) {
  if (!changes) {
    return (
      <Section title="Since your last audit">
        <p className="text-muted-foreground">
          This is the first audit of this site. Run it again after making fixes
          to see what changed.
        </p>
      </Section>
    );
  }
  const lines = [
    { rows: changes.fixed, name: "fixed", none: "Nothing yet", tone: "good" },
    { rows: changes.added, name: "new", none: "Nothing new", tone: "bad" },
    {
      rows: changes.still,
      name: "still there",
      none: "Nothing left",
      tone: "ok",
    },
  ] as const;
  return (
    <Section
      title="Since your last audit"
      note={`Compared with ${formatDate(changes.previousStartedAt)}. Only pages read both times are compared.`}
    >
      <div>
        {lines.map(({ rows, name, none, tone }) => {
          const total = rows.reduce((sum, row) => sum + row.pages, 0);
          const top = rows[0];
          return (
            <div
              key={name}
              className="flex min-h-14 items-center gap-3.5 border-t border-border py-2.5 first:border-t-0"
            >
              <span
                className={cn(
                  "min-w-16 text-[40px] leading-none tracking-tight tabular-nums",
                  TONE_CLASS[total ? tone : "ok"],
                )}
              >
                {total.toLocaleString()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block">{name}</span>
                <span className="text-sm wrap-anywhere text-muted-foreground">
                  {top
                    ? `${getIssueDescriptor(top.issueType)?.title ?? top.issueType} on ${pagePath(top.example ?? "", canonicalHost)}${total > 1 ? ` and ${(total - 1).toLocaleString()} more` : ""}`
                    : none}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function Speed({
  data,
  onOpenPage,
}: {
  data: AuditResultsData;
  onOpenPage: (url: string) => void;
}) {
  const worked = data.lighthouse.filter((row) => !isLighthouseFailure(row));
  if (data.lighthouse.length === 0) {
    return (
      <Section title="Speed">
        <p className="text-muted-foreground">
          Speed was not tested in this audit. Turn on Lighthouse when you run it
          again.
        </p>
      </Section>
    );
  }
  const [performance] = SPEED_MEASURES;
  const mobile = worked.filter((row) => row.strategy === "mobile");
  const lcp = SPEED_MEASURES.find(({ field }) => field === "lcpMs");
  const slowest = sortBy(
    mobile.flatMap(({ id, pageUrl, lcpMs }) =>
      pageUrl && lcpMs !== null ? [{ id, pageUrl, lcpMs }] : [],
    ),
    [(row) => row.lcpMs, "desc"],
  ).slice(0, 3);
  return (
    <Section title="Speed" note={speedScope(data)}>
      <div className="flex flex-wrap gap-10">
        {(["mobile", "desktop"] as const).map((device) => {
          const score = average(
            worked.filter((row) => row.strategy === device),
            performance.field,
          );
          const tone = score === null ? "muted" : performance.tone(score);
          return (
            <div key={device}>
              <p className="text-sm text-muted-foreground capitalize">
                {device}
              </p>
              <p
                className={cn(
                  "text-[40px] leading-tight tracking-tight tabular-nums",
                  TONE_CLASS[tone],
                )}
              >
                {score === null ? "–" : performance.format(score)}
              </p>
              <p className={cn("text-sm", TONE_CLASS[tone])}>
                {SCORE_WORD[tone] ?? "Every test failed"}
              </p>
            </div>
          );
        })}
      </div>
      {slowest.length > 0 && lcp ? (
        <>
          <p className="text-sm text-muted-foreground">Slowest on mobile</p>
          <div>
            {slowest.map((row) => (
              <RowButton
                key={row.id}
                className="min-h-11 py-1.5"
                onClick={() => onOpenPage(row.pageUrl)}
              >
                <span className="min-w-0 flex-1 wrap-anywhere">
                  {pagePath(row.pageUrl, data.canonicalHost)}
                </span>
                <span
                  className={cn(
                    "tabular-nums",
                    TONE_CLASS[lcp.tone(row.lcpMs)],
                  )}
                >
                  {lcp.format(row.lcpMs)}
                </span>
              </RowButton>
            ))}
          </div>
        </>
      ) : null}
    </Section>
  );
}

export function speedScope(data: AuditResultsData) {
  const tested = new Set(data.lighthouse.map((row) => row.pageId)).size;
  return `${tested} of ${plural(data.pageCount, "page")} tested: your start page, then one per URL pattern, up to 10.`;
}

function About({ data }: { data: AuditResultsData }) {
  const { audit, fetchClassCounts, lighthouse } = data;
  const failed = lighthouse.filter(isLighthouseFailure).length;
  return (
    <Section title="About this audit">
      <Facts
        rows={[
          ["Started", formatStartedAt(audit.startedAt)],
          [
            "Finished",
            audit.completedAt ? formatStartedAt(audit.completedAt) : "–",
          ],
          ["Start page", audit.startUrl],
          ["Page limit", audit.config.maxPages.toLocaleString()],
          ["Read", fetchClassCounts.ok.toLocaleString(), "good"],
          ["Blocked", fetchClassCounts.blocked.toLocaleString()],
          ["Rate limited", fetchClassCounts.rate_limited.toLocaleString()],
          ["Failed", fetchClassCounts.error.toLocaleString()],
          ["Average answer time", `${data.averageResponseMs}ms`],
          ["Render JavaScript", audit.config.renderJavaScript ? "On" : "Off"],
          ["Skipped paths", audit.config.excludePaths?.join(", ") || "None"],
          [
            "Speed tests",
            lighthouse.length > 0
              ? `${lighthouse.length - failed} worked, ${failed} failed`
              : "Off",
          ],
        ]}
      />
    </Section>
  );
}
