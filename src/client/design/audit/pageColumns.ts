import {
  EMPTY_PAGES_FILTERS,
  type PagesFilters,
} from "@/client/features/audit/results/AuditResultsTableFilterLogic";
import type { PageFetchClass } from "@/shared/audit-fetch-class";
import type {
  AuditReportShow,
  AuditReportSort,
} from "@/types/schemas/auditReport";
import {
  FETCH_LABEL,
  reach,
  SPEED_MEASURES,
  type ReportPage,
  type Tone,
} from "./auditReportFormat";
import type { ReportColumn } from "./ReportTable";

export type ReportFilters = PagesFilters & { show: AuditReportShow };
export const EMPTY_FILTERS: ReportFilters = {
  ...EMPTY_PAGES_FILTERS,
  show: "all",
};

export const SHOW_OPTIONS: Array<[AuditReportShow, string]> = [
  ["all", "All pages"],
  ["problems", "With problems"],
  ["unusable", "Search engines can’t use"],
  ["not-in-sitemap", "Not in the sitemap"],
  ["no-description", "No meta description"],
  ["no-structured-data", "No structured data"],
  ["no-share-image", "No social preview image"],
  ["redirects", "Redirects"],
  ["unread", "Couldn’t be read"],
  ["speed-tested", "Tested for speed"],
];

export const CRAWL_RESULT_OPTIONS: Array<["all" | PageFetchClass, string]> = [
  ["all", "All"],
  ["ok", FETCH_LABEL.ok],
  ["error", FETCH_LABEL.error],
  ["blocked", FETCH_LABEL.blocked],
  ["rate_limited", FETCH_LABEL.rate_limited],
];

export const PAGE_VIEWS = [
  "Main",
  "Search",
  "Content",
  "Links & sharing",
] as const;
export type PageView = (typeof PAGE_VIEWS)[number];

type Cell = [value: string | number, tone?: Tone];
type Column = ReportColumn<ReportPage, AuditReportSort>;
type SpeedOf = (
  page: ReportPage,
  strategy: "mobile" | "desktop",
) => number | "failed" | null;

const column = (
  label: string,
  sort: AuditReportSort,
  cell: (page: ReportPage) => Cell,
): Column => ({ label, sort, cell });

/** A fact about the page's content, blank where the content was not read. */
const content = (
  label: string,
  sort: AuditReportSort,
  cell: (page: ReportPage) => Cell,
) =>
  column(label, sort, (page) =>
    page.isAnalyzed ? cell(page) : ["–", "muted"],
  );

const present = (value: unknown): Cell => (value ? ["Yes"] : ["No", "warn"]);

const lengthCell = (text: string | null, min: number, max: number): Cell =>
  text
    ? [text.length, text.length < min || text.length > max ? "warn" : "ok"]
    : ["Missing", "warn"];

function statusCell({ fetchClass, statusCode }: ReportPage): Cell {
  if (fetchClass === "error") return ["Failed", "bad"];
  const status = statusCode ?? 0;
  if (fetchClass !== "ok") {
    return [`${status} ${FETCH_LABEL[fetchClass].toLowerCase()}`, "bad"];
  }
  return [status, status >= 400 ? "bad" : status >= 300 ? "warn" : "good"];
}

export function hasCanonicalConflict(page: ReportPage) {
  return Boolean(
    page.canonicalUrl &&
    page.headerCanonicalUrl &&
    page.canonicalUrl !== page.headerCanonicalUrl,
  );
}

function canonicalCell(page: ReportPage): Cell {
  const canonical = page.canonicalUrl ?? page.headerCanonicalUrl;
  if (hasCanonicalConflict(page)) return ["Conflict", "warn"];
  if (!canonical) return ["None", "warn"];
  return canonical === page.url ? ["Itself"] : ["Another page", "warn"];
}

const speedCell = (value: ReturnType<SpeedOf>): Cell =>
  value === null
    ? ["Not tested", "muted"]
    : value === "failed"
      ? ["Failed", "bad"]
      : [value, SPEED_MEASURES[0].tone(value)];

const SEARCH = [
  content("Title length", "titleLength", (page) =>
    lengthCell(page.title, 10, 60),
  ),
  content("Description length", "descriptionLength", (page) =>
    lengthCell(page.metaDescription, 70, 160),
  ),
  content("Canonical", "canonical", canonicalCell),
  content("Robots rule", "robots", (page) =>
    page.isNoindex ? ["noindex", "warn"] : ["None"],
  ),
  content("In sitemap", "inSitemap", (page) => present(page.inSitemap)),
  content("Clicks deep", "crawlDepth", ({ crawlDepth }) =>
    crawlDepth === null
      ? ["No link", "warn"]
      : [crawlDepth, crawlDepth >= 5 ? "warn" : "ok"],
  ),
];

const CONTENT = [
  content("Words", "wordCount", ({ wordCount }) => [
    wordCount,
    wordCount < 150 ? "warn" : "ok",
  ]),
  content("H1", "h1Count", ({ h1Count }) => [
    h1Count,
    h1Count === 1 ? "ok" : "warn",
  ]),
  content("H2", "h2Count", (page) => [page.h2Count]),
  content("H3", "h3Count", (page) => [page.h3Count]),
  content("H4", "h4Count", (page) => [page.h4Count]),
  content("H5", "h5Count", (page) => [page.h5Count]),
  content("H6", "h6Count", (page) => [page.h6Count]),
  content("Images", "imagesTotal", (page) => [page.imagesTotal]),
  content("Missing alt", "imagesMissingAlt", ({ imagesMissingAlt }) => [
    imagesMissingAlt,
    imagesMissingAlt > 0 ? "warn" : "ok",
  ]),
];

const LINKS = [
  content("Links to this site", "internalLinkCount", (page) => [
    page.internalLinkCount,
    page.internalLinkCount ? "ok" : "warn",
  ]),
  content("Links to other sites", "externalLinkCount", (page) => [
    page.externalLinkCount,
  ]),
  content("Structured data", "structuredData", (page) =>
    present(page.hasStructuredData),
  ),
  content("Share title", "ogTitle", (page) => present(page.ogTitle)),
  content("Share text", "ogDescription", (page) => present(page.ogDescription)),
  content("Share image", "ogImage", (page) => present(page.ogImage)),
];

export function pageColumns(view: PageView, speedOf: SpeedOf): Column[] {
  if (view === "Search") return SEARCH;
  if (view === "Content") return CONTENT;
  if (view === "Links & sharing") return LINKS;
  return [
    column("Status", "statusCode", statusCell),
    column("Problems", "problems", ({ problemCount }) =>
      problemCount ? [problemCount] : ["None", "muted"],
    ),
    column("Can be indexed", "indexable", reach),
    column("Answered in", "responseTimeMs", ({ responseTimeMs }) =>
      responseTimeMs
        ? [`${responseTimeMs}ms`, responseTimeMs > 1500 ? "bad" : "ok"]
        : ["–", "muted"],
    ),
    column("Mobile", "mobileScore", (page) =>
      speedCell(speedOf(page, "mobile")),
    ),
    column("Desktop", "desktopScore", (page) =>
      speedCell(speedOf(page, "desktop")),
    ),
  ];
}
