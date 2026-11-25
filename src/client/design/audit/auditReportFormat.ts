import { sort } from "remeda";
import {
  CRAWL_STOP_ISSUE_TYPES,
  getIssueDescriptor,
  ISSUE_SEVERITY_ORDER,
  type IssueSeverity,
} from "@/shared/audit-issues";
import { resolveIssueSeverity } from "@/client/features/audit/results/IssuesView";
import type { AuditLighthouseRow } from "@/client/features/audit/results/types";
import type {
  getAuditReportOverview,
  getAuditReportPage,
} from "@/serverFunctions/auditReport";
import { z } from "zod";

export type ReportOverview = Awaited<ReturnType<typeof getAuditReportOverview>>;
type ReportPageData = Awaited<ReturnType<typeof getAuditReportPage>>;
export type ReportPage = ReportPageData["page"];
export type ReportPageIssue = ReportPageData["issues"][number];

export type Tone = "ok" | "muted" | "good" | "warn" | "bad";
export const TONE_CLASS: Record<Tone, string> = {
  ok: "text-foreground",
  muted: "text-muted-foreground",
  good: "text-success",
  warn: "text-amber-700 dark:text-warning",
  bad: "text-destructive",
};

export const SEVERITY: Record<
  IssueSeverity,
  { label: string; className: string }
> = {
  critical: {
    label: "Serious",
    className: "border-destructive text-destructive",
  },
  warning: {
    label: "Warning",
    className:
      "border-amber-700 text-amber-700 dark:border-warning dark:text-warning",
  },
  info: { label: "Minor", className: "border-info text-info" },
};

export function plural(count: number, word: string) {
  return `${count.toLocaleString()} ${word}${count === 1 ? "" : "s"}`;
}

/** The host is only worth showing for a page off the site's usual one. */
export function pagePath(url: string, canonicalHost: string) {
  try {
    const { host, hostname, pathname, search } = new URL(url);
    return (hostname === canonicalHost ? "" : host) + pathname + search;
  } catch {
    return url;
  }
}

const CRAWL_STOPS = new Set<string>(CRAWL_STOP_ISSUE_TYPES);

export type Fix = {
  issueType: string;
  severity: IssueSeverity;
  title: string;
  why: string;
  explanation: string;
  howToFix: string;
  pages: number;
};

/** One entry per kind of problem: most serious first, then most pages. */
export function toFixes(issueTypes: ReportOverview["issueTypes"]): Fix[] {
  const fixes = issueTypes
    .filter(({ issueType }) => !CRAWL_STOPS.has(issueType))
    .map((issue) => {
      const descriptor = getIssueDescriptor(issue.issueType);
      const explanation = descriptor?.explanation ?? "";
      return {
        issueType: issue.issueType,
        severity: resolveIssueSeverity(issue),
        title: descriptor?.title ?? issue.issueType,
        why: explanation.split(/(?<!e\.g\.)(?<=\.)\s/)[0],
        explanation,
        howToFix: descriptor?.howToFix ?? "",
        pages: issue.pages,
      };
    });
  return sort(
    fixes,
    (a, b) =>
      ISSUE_SEVERITY_ORDER[a.severity] - ISSUE_SEVERITY_ORDER[b.severity] ||
      b.pages - a.pages,
  );
}

const detailsSchema = z.object({
  statusCode: z.number().nullish(),
  responseTimeMs: z.number().nullish(),
  robotsMeta: z.string().nullish(),
  xRobotsTag: z.string().nullish(),
  htmlCanonical: z.string().nullish(),
  headerCanonical: z.string().nullish(),
  canonicalUrl: z.string().nullish(),
  crawlDepth: z.number().nullish(),
  wordCount: z.number().nullish(),
  length: z.number().nullish(),
  max: z.number().nullish(),
  min: z.number().nullish(),
  title: z.string().nullish(),
  description: z.string().nullish(),
  h1Count: z.number().nullish(),
  imagesMissingAlt: z.number().nullish(),
  imagesTotal: z.number().nullish(),
  groupSize: z.number().nullish(),
  otherUrls: z.array(z.string()).nullish(),
  hops: z.array(z.string()).nullish(),
  finalUrl: z.string().nullish(),
  targetUrl: z.string().nullish(),
  targetStatus: z.number().nullish(),
  pagesCrawled: z.number().nullish(),
  urlsNotCrawled: z.number().nullish(),
});

export function parseDetails(detailsJson: string | null) {
  if (!detailsJson) return null;
  // AuditRepository always stores JSON.stringify of an object.
  return detailsSchema.safeParse(JSON.parse(detailsJson)).data ?? null;
}

const SAME: Record<string, string> = {
  "duplicate-title": "title",
  "duplicate-meta-description": "description",
  "duplicate-content": "text",
};

/** What the audit saved about one issue, in words. */
export function describeIssue(
  issue: { issueType: string; detailsJson: string | null },
  canonicalHost: string,
): string {
  const d = parseDetails(issue.detailsJson);
  if (!d) return "";
  const path = (url: string) => pagePath(url, canonicalHost);
  if (d.targetUrl) {
    return `Links to ${path(d.targetUrl)}${d.targetStatus ? `, which returns ${d.targetStatus}` : ""}`;
  }
  if (d.hops) {
    return (
      d.hops.map(path).join(" → ") +
      (d.finalUrl ? ` · ends at ${path(d.finalUrl)}` : "")
    );
  }
  if (d.groupSize != null && SAME[issue.issueType]) {
    return `Same ${SAME[issue.issueType]} as ${(d.otherUrls ?? []).map(path).join(", ")} · ${d.groupSize} pages share it`;
  }
  if (d.htmlCanonical || d.headerCanonical) {
    return `In the page: ${d.htmlCanonical ?? "none"} · in the header: ${d.headerCanonical ?? "none"}`;
  }
  if (d.canonicalUrl) return `Points to ${path(d.canonicalUrl)}`;
  if (issue.issueType === "noindex-page") {
    return [
      d.robotsMeta && `Robots tag: ${d.robotsMeta}`,
      d.xRobotsTag && `robots header: ${d.xRobotsTag}`,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (d.length != null) {
    const limit = d.max != null ? `${d.max} at most` : `${d.min} at least`;
    return `${d.length} characters, ${limit}: “${d.title ?? d.description ?? ""}”`;
  }
  if (d.crawlDepth != null) return `${d.crawlDepth} clicks from the start page`;
  if (d.h1Count != null) return `${d.h1Count} H1 headings`;
  if (d.imagesMissingAlt != null) {
    return `${d.imagesMissingAlt} of ${d.imagesTotal ?? d.imagesMissingAlt} images`;
  }
  if (d.wordCount != null) return plural(d.wordCount, "word");
  if (d.responseTimeMs != null) return `${d.responseTimeMs}ms to answer`;
  if (d.statusCode) return `Status ${d.statusCode}`;
  return "";
}

/** Whether search engines can use a page, as far as the crawl saw. */
export function reach(page: ReportPage): [string, Tone] {
  if (page.fetchClass !== "ok") return ["Not read", "muted"];
  const status = page.statusCode ?? 0;
  if (status >= 400) return [`No, ${status} error`, "bad"];
  if (status >= 300) return ["Redirects", "muted"];
  if (page.isNoindex) return ["No, noindex", "warn"];
  return ["Yes", "ok"];
}

export const FETCH_LABEL = {
  ok: "Read",
  error: "Failed",
  blocked: "Blocked",
  rate_limited: "Rate limited",
} as const;

type SpeedField =
  | "performanceScore"
  | "accessibilityScore"
  | "bestPracticesScore"
  | "seoScore"
  | "lcpMs"
  | "inpMs"
  | "cls"
  | "ttfbMs";

const scoreBand = (value: number): Tone =>
  value >= 90 ? "good" : value >= 50 ? "warn" : "bad";
const band =
  (good: number, poor: number) =>
  (value: number): Tone =>
    value <= good ? "good" : value <= poor ? "warn" : "bad";
const whole = (value: number) => String(Math.round(value));
const seconds = (value: number) => `${(value / 1000).toFixed(1)}s`;
const ms = (value: number) => `${Math.round(value)}ms`;

export const SPEED_MEASURES: Array<{
  field: SpeedField;
  name: string;
  short: string;
  hint: string;
  format: (value: number) => string;
  tone: (value: number) => Tone;
}> = [
  {
    field: "performanceScore",
    name: "Performance",
    short: "Score",
    hint: "",
    format: whole,
    tone: scoreBand,
  },
  {
    field: "accessibilityScore",
    name: "Accessibility",
    short: "Accessibility",
    hint: "",
    format: whole,
    tone: scoreBand,
  },
  {
    field: "bestPracticesScore",
    name: "Best practices",
    short: "Best practices",
    hint: "",
    format: whole,
    tone: scoreBand,
  },
  {
    field: "seoScore",
    name: "SEO basics",
    short: "SEO",
    hint: "",
    format: whole,
    tone: scoreBand,
  },
  {
    field: "lcpMs",
    name: "Main content appears",
    short: "Main content",
    hint: "good: 2.5s or less",
    format: seconds,
    tone: band(2500, 4000),
  },
  {
    field: "inpMs",
    name: "Delay after a tap",
    short: "Tap delay",
    hint: "good: 200ms or less",
    format: ms,
    tone: band(200, 500),
  },
  {
    field: "cls",
    name: "Page jumping around",
    short: "Jumping",
    hint: "good: 0.10 or less",
    format: (value) => value.toFixed(2),
    tone: (value) => band(0.1, 0.25)(Math.round(value * 100) / 100),
  },
  {
    field: "ttfbMs",
    name: "Server wait",
    short: "Server wait",
    hint: "good: 800ms or less",
    format: ms,
    tone: band(800, 1800),
  },
];

export const SCORE_WORD: Partial<Record<Tone, string>> = {
  good: "Good",
  warn: "Needs work",
  bad: "Poor",
};

export function average(rows: AuditLighthouseRow[], field: SpeedField) {
  const values = rows
    .map((row) => row[field])
    .filter((value) => value !== null);
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
