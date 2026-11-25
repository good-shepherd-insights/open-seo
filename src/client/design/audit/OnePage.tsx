import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { BackButton } from "@/client/components/PageHeader";
import { QueryState } from "@/client/components/QueryState";
import { Button } from "@/client/components/ui/button";
import { isLighthouseFailure } from "@/client/features/audit/results/AuditResultsTableFilterLogic";
import type { AuditResultsData } from "@/client/features/audit/results/types";
import { getAuditReportPage } from "@/serverFunctions/auditReport";
import {
  describeIssue,
  FETCH_LABEL,
  pagePath,
  plural,
  reach,
  toFixes,
  TONE_CLASS,
  type ReportPage,
  type ReportPageIssue,
} from "./auditReportFormat";
import { hasCanonicalConflict } from "./pageColumns";
import {
  Facts,
  Section,
  SeverityChip,
  SpeedGrid,
  TwoColumns,
  type SpeedCell,
} from "./parts";

export function OnePage({
  auditRef,
  data,
  url,
  onBack,
}: {
  auditRef: { projectId: string; auditId: string };
  data: AuditResultsData;
  url: string;
  onBack: () => void;
}) {
  const top = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Opened from far down a list.
    void top.current?.scrollIntoView({ block: "end" });
  }, [url]);
  const query = useQuery({
    queryKey: ["audit-report-page", auditRef, url],
    queryFn: () => getAuditReportPage({ data: { ...auditRef, url } }),
  });
  return (
    <div className="space-y-6">
      <div ref={top}>
        <BackButton onClick={onBack}>Back to the report</BackButton>
      </div>
      <QueryState query={query} errorFallback="Could not load this page">
        {({ page, issues }) => (
          <>
            <div>
              <h1 className="text-2xl font-semibold wrap-anywhere">
                {pagePath(page.url, data.canonicalHost)}
              </h1>
              <p className="mt-1 wrap-anywhere text-muted-foreground">
                {page.fetchClass === "error"
                  ? "Couldn’t be read"
                  : `Status ${page.statusCode} · answered in ${page.responseTimeMs}ms`}
                {page.redirectUrl ? ` · redirects to ${page.redirectUrl}` : ""}
              </p>
            </div>
            <Issues issues={issues} canonicalHost={data.canonicalHost} />
            <TwoColumns>
              {page.isAnalyzed ? <InGoogle page={page} /> : null}
              <PageSpeed auditRef={auditRef} data={data} page={page} />
              <Access page={page} />
              <Content page={page} />
              <Share page={page} />
            </TwoColumns>
          </>
        )}
      </QueryState>
    </div>
  );
}

function Issues({
  issues,
  canonicalHost,
}: {
  issues: ReportPageIssue[];
  canonicalHost: string;
}) {
  const fixes = toFixes(
    [...new Map(issues.map((issue) => [issue.issueType, issue])).values()].map(
      ({ issueType, severity }) => ({ issueType, severity, pages: 1 }),
    ),
  );
  return (
    <Section
      title={
        fixes.length > 0
          ? `${plural(fixes.length, "problem")} on this page`
          : "No problems on this page"
      }
    >
      {fixes.map((fix) => (
        <div key={fix.issueType} className="border-t border-border pt-3.5">
          <div className="flex justify-between gap-3">
            <h3 className="font-medium">{fix.title}</h3>
            <SeverityChip severity={fix.severity} />
          </div>
          {issues
            .filter((issue) => issue.issueType === fix.issueType)
            .map((issue) => (
              <p
                key={issue.id}
                className="text-sm wrap-anywhere text-foreground/80"
              >
                {describeIssue(issue, canonicalHost)}
              </p>
            ))}
          <p className="mt-1 text-muted-foreground">{fix.howToFix}</p>
        </div>
      ))}
    </Section>
  );
}

function InGoogle({ page }: { page: ReportPage }) {
  return (
    <Section title="How it can look in Google">
      <div className="rounded-lg bg-background p-4">
        <p className="text-sm wrap-anywhere text-muted-foreground">
          {page.url}
        </p>
        <p
          className={cn(
            "my-1 text-lg",
            page.title ? "text-info" : TONE_CLASS.bad,
          )}
        >
          {page.title || "No title"}
        </p>
        <p
          className={cn(
            "text-sm",
            TONE_CLASS[page.metaDescription ? "muted" : "bad"],
          )}
        >
          {page.metaDescription ||
            "No meta description. Google picks its own text."}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Title {page.title?.length ?? 0} characters · description{" "}
        {page.metaDescription?.length ?? 0} characters
      </p>
    </Section>
  );
}

function PageSpeed({
  auditRef,
  data,
  page,
}: {
  auditRef: { projectId: string; auditId: string };
  data: AuditResultsData;
  page: ReportPage;
}) {
  const tests = data.lighthouse.filter((row) => row.pageId === page.id);
  if (tests.length === 0) {
    return (
      <Section title="Speed">
        <p className="text-muted-foreground">
          {data.lighthouse.length > 0
            ? "Not tested. A page with the same URL pattern was tested instead, or this came after the first 10 patterns."
            : "Speed was not tested in this audit. Turn on Lighthouse when you run it again."}
        </p>
      </Section>
    );
  }
  const test = (device: "mobile" | "desktop") =>
    tests.find((row) => row.strategy === device);
  const cell = (device: "mobile" | "desktop"): SpeedCell => {
    const row = test(device);
    const failed = row !== undefined && isLighthouseFailure(row);
    return { values: row && !failed ? row : null, failed };
  };
  const detailed = [test("mobile"), test("desktop")].find(
    (row) => row?.r2Key && !isLighthouseFailure(row),
  );
  return (
    <Section title="Speed">
      <SpeedGrid mobile={cell("mobile")} desktop={cell("desktop")} />
      {tests.filter(isLighthouseFailure).map((row) => (
        <p key={row.id} className={cn("text-sm", TONE_CLASS.bad)}>
          {row.strategy === "mobile" ? "Mobile" : "Desktop"} test failed:{" "}
          {row.errorMessage ?? "The test returned no scores."}
        </p>
      ))}
      {detailed ? (
        <Button
          variant="outline"
          className="self-start"
          nativeButton={false}
          render={
            <Link
              to="/p/$projectId/audit/issues/$resultId"
              params={{ projectId: auditRef.projectId, resultId: detailed.id }}
              search={{ auditId: auditRef.auditId, category: "performance" }}
            />
          }
        >
          See what slows this page
        </Button>
      ) : null}
    </Section>
  );
}

function Access({ page }: { page: ReportPage }) {
  const [indexable, tone] = reach(page);
  const conflict = hasCanonicalConflict(page) ? "warn" : "ok";
  return (
    <Section title="Search engine access">
      <Facts
        rows={[
          ["Can be indexed", indexable, tone === "ok" ? "good" : tone],
          [
            "In the sitemap",
            page.inSitemap ? "Yes" : "No",
            page.inSitemap ? "ok" : "warn",
          ],
          [
            "Crawl result",
            FETCH_LABEL[page.fetchClass],
            page.fetchClass === "ok" ? "ok" : "bad",
          ],
          ...(page.redirectUrl
            ? [["Redirects to", page.redirectUrl] satisfies [string, string]]
            : []),
          ["Canonical, in the page", page.canonicalUrl || "None", conflict],
          [
            "Canonical, in the header",
            page.headerCanonicalUrl || "None",
            conflict,
          ],
          [
            "Robots, in the page",
            page.robotsMeta || "None",
            page.robotsMeta?.toLowerCase().includes("noindex") ? "warn" : "ok",
          ],
          [
            "Robots, in the header",
            page.xRobotsTag || "None",
            page.xRobotsTag?.toLowerCase().includes("noindex") ? "warn" : "ok",
          ],
          [
            "Clicks from the start page",
            page.crawlDepth ?? "No link found",
            page.crawlDepth === null ? "warn" : "ok",
          ],
          [
            "Structured data",
            !page.isAnalyzed
              ? "Not checked"
              : page.hasStructuredData
                ? "Yes"
                : "No",
          ],
        ]}
      />
    </Section>
  );
}

function Content({ page }: { page: ReportPage }) {
  return (
    <Section title="What is on the page">
      <Facts
        rows={
          page.isAnalyzed
            ? [
                [
                  "Words",
                  page.wordCount.toLocaleString(),
                  page.wordCount < 150 ? "warn" : "ok",
                ],
                [
                  "H1 headings",
                  page.h1Count,
                  page.h1Count === 1 ? "ok" : "warn",
                ],
                ["H2 headings", page.h2Count],
                ["H3 headings", page.h3Count],
                ["H4 headings", page.h4Count],
                ["H5 headings", page.h5Count],
                ["H6 headings", page.h6Count],
                ["Images", page.imagesTotal],
                [
                  "Images missing alt text",
                  page.imagesMissingAlt,
                  page.imagesMissingAlt ? "warn" : "ok",
                ],
                [
                  "Links to this site",
                  page.internalLinkCount,
                  page.internalLinkCount ? "ok" : "warn",
                ],
                ["Links to other sites", page.externalLinkCount],
              ]
            : [["Content", "Not checked", "muted"]]
        }
      />
    </Section>
  );
}

function Share({ page }: { page: ReportPage }) {
  return (
    <Section title="When it’s shared">
      <Facts
        rows={[
          ["Title", page.ogTitle || "None", page.ogTitle ? "ok" : "muted"],
          [
            "Description",
            page.ogDescription || "None",
            page.ogDescription ? "ok" : "muted",
          ],
          ["Image", page.ogImage || "None", page.ogImage ? "ok" : "muted"],
        ]}
      />
    </Section>
  );
}
