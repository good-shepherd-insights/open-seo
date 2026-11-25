/** Reads behind the audit report that the shared audit reads do not cover. */
import {
  aliasedTable,
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  exists,
  gte,
  inArray,
  isNotNull,
  lt,
  min,
  ne,
  notExists,
  notInArray,
  or,
  sql,
  type AnyColumn,
  type SQL,
} from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/db";
import {
  auditIssues,
  auditLighthouseResults,
  auditPages,
  audits,
} from "@/db/schema";
import { buildPagesWhere } from "@/server/features/audit/repositories/auditResultsQueries";
import { CRAWL_STOP_ISSUE_TYPES } from "@/shared/audit-issues";
import { AuditStatus } from "@/shared/audit-status";
import type {
  AuditReportShow,
  AuditReportSort,
  getAuditReportPagesSchema,
} from "@/types/schemas/auditReport";

type ReportPagesParams = Omit<
  z.output<typeof getAuditReportPagesSchema>,
  "projectId" | "auditId"
>;

const isOk = and(
  eq(auditPages.fetchClass, "ok"),
  gte(auditPages.statusCode, 200),
  lt(auditPages.statusCode, 300),
);
// Only HTML whose content was read has a hash: not a PDF, a redirect or an
// empty app shell, whose blank fields mean nothing.
const isAnalyzed = and(isOk, isNotNull(auditPages.contentHash));
const isNoindex = sql`lower(coalesce(${auditPages.robotsMeta}, '') || ',' || coalesce(${auditPages.xRobotsTag}, '')) like '%noindex%'`;
const isBlank = (column: AnyColumn) => sql`coalesce(${column}, '') = ''`;

// Table-qualified by hand: Drizzle writes columns unqualified in a one-table
// select, which would bind both sides to the inner table.
const problemCount = sql<number>`(
  select count(distinct audit_issues.issue_type) from audit_issues
  where audit_issues.page_id = audit_pages.id
)`.mapWith(Number);
const hasSerious = sql<boolean>`exists (
  select 1 from audit_issues
  where audit_issues.page_id = audit_pages.id
  and audit_issues.severity = 'critical'
)`.mapWith(Boolean);
const speedTested = sql`exists (
  select 1 from audit_lighthouse_results
  where audit_lighthouse_results.page_id = audit_pages.id
)`;
const score = (strategy: "mobile" | "desktop") => sql`(
  select max(audit_lighthouse_results.performance_score)
  from audit_lighthouse_results
  where audit_lighthouse_results.page_id = audit_pages.id
  and audit_lighthouse_results.strategy = ${strategy}
)`;

const SHOW: Record<AuditReportShow, SQL | undefined> = {
  all: undefined,
  problems: sql`exists (
    select 1 from audit_issues where audit_issues.page_id = audit_pages.id
  )`,
  unusable: and(
    eq(auditPages.fetchClass, "ok"),
    or(gte(auditPages.statusCode, 400), and(isOk, isNoindex)),
  ),
  "not-in-sitemap": and(isAnalyzed, eq(auditPages.inSitemap, false)),
  "no-description": and(isAnalyzed, isBlank(auditPages.metaDescription)),
  "no-structured-data": and(
    isAnalyzed,
    eq(auditPages.hasStructuredData, false),
  ),
  "no-share-image": and(isAnalyzed, isBlank(auditPages.ogImage)),
  redirects: and(
    eq(auditPages.fetchClass, "ok"),
    gte(auditPages.statusCode, 300),
    lt(auditPages.statusCode, 400),
  ),
  unread: ne(auditPages.fetchClass, "ok"),
  "speed-tested": speedTested,
};

const SORT: Record<AuditReportSort, SQL | AnyColumn> = {
  url: auditPages.url,
  statusCode: auditPages.statusCode,
  problems: problemCount,
  indexable: sql`case
    when ${auditPages.fetchClass} <> 'ok' then 0
    when ${auditPages.statusCode} >= 400 then 1
    when ${auditPages.statusCode} >= 300 then 2
    when ${isNoindex} then 3
    else 4 end`,
  responseTimeMs: auditPages.responseTimeMs,
  mobileScore: score("mobile"),
  desktopScore: score("desktop"),
  titleLength: sql`length(${auditPages.title})`,
  descriptionLength: sql`length(${auditPages.metaDescription})`,
  canonical: auditPages.canonicalUrl,
  robots: sql`case when ${isNoindex} then 1 else 0 end`,
  inSitemap: auditPages.inSitemap,
  crawlDepth: auditPages.crawlDepth,
  wordCount: auditPages.wordCount,
  h1Count: auditPages.h1Count,
  h2Count: auditPages.h2Count,
  h3Count: auditPages.h3Count,
  h4Count: auditPages.h4Count,
  h5Count: auditPages.h5Count,
  h6Count: auditPages.h6Count,
  imagesTotal: auditPages.imagesTotal,
  imagesMissingAlt: auditPages.imagesMissingAlt,
  internalLinkCount: auditPages.internalLinkCount,
  externalLinkCount: auditPages.externalLinkCount,
  structuredData: auditPages.hasStructuredData,
  ogTitle: auditPages.ogTitle,
  ogDescription: auditPages.ogDescription,
  ogImage: auditPages.ogImage,
};

const CONTENT_SORTS = new Set<AuditReportSort>([
  "titleLength",
  "descriptionLength",
  "canonical",
  "robots",
  "inSitemap",
  "crawlDepth",
  "wordCount",
  "h1Count",
  "h2Count",
  "h3Count",
  "h4Count",
  "h5Count",
  "h6Count",
  "imagesTotal",
  "imagesMissingAlt",
  "internalLinkCount",
  "externalLinkCount",
  "structuredData",
  "ogTitle",
  "ogDescription",
  "ogImage",
]);

const PAGE_FIELDS = {
  id: auditPages.id,
  url: auditPages.url,
  statusCode: auditPages.statusCode,
  fetchClass: auditPages.fetchClass,
  redirectUrl: auditPages.redirectUrl,
  responseTimeMs: auditPages.responseTimeMs,
  title: auditPages.title,
  metaDescription: auditPages.metaDescription,
  canonicalUrl: auditPages.canonicalUrl,
  headerCanonicalUrl: auditPages.headerCanonicalUrl,
  robotsMeta: auditPages.robotsMeta,
  xRobotsTag: auditPages.xRobotsTag,
  inSitemap: auditPages.inSitemap,
  crawlDepth: auditPages.crawlDepth,
  wordCount: auditPages.wordCount,
  h1Count: auditPages.h1Count,
  h2Count: auditPages.h2Count,
  h3Count: auditPages.h3Count,
  h4Count: auditPages.h4Count,
  h5Count: auditPages.h5Count,
  h6Count: auditPages.h6Count,
  imagesTotal: auditPages.imagesTotal,
  imagesMissingAlt: auditPages.imagesMissingAlt,
  internalLinkCount: auditPages.internalLinkCount,
  externalLinkCount: auditPages.externalLinkCount,
  hasStructuredData: auditPages.hasStructuredData,
  ogTitle: auditPages.ogTitle,
  ogDescription: auditPages.ogDescription,
  ogImage: auditPages.ogImage,
  // False for the pages whose content fields are blank because nothing was read.
  isAnalyzed: sql<boolean>`${isAnalyzed}`.mapWith(Boolean),
  isNoindex: sql<boolean>`${isNoindex}`.mapWith(Boolean),
  problemCount,
  hasSerious,
};

export async function listReportPages(
  auditId: string,
  params: ReportPagesParams,
) {
  const where = and(buildPagesWhere(auditId, params), SHOW[params.show]);
  const direction = params.order === "desc" ? desc : asc;
  const [rows, totals] = await Promise.all([
    db
      .select(PAGE_FIELDS)
      .from(auditPages)
      .where(where)
      .orderBy(
        // Pages with no value sort last in both directions.
        ...(CONTENT_SORTS.has(params.sort)
          ? [sql`case when ${isAnalyzed} then 0 else 1 end`]
          : []),
        sql`case when ${SORT[params.sort]} is null then 1 else 0 end`,
        direction(SORT[params.sort]),
        asc(auditPages.url),
        asc(auditPages.id),
      )
      .limit(params.pageSize)
      .offset((params.page - 1) * params.pageSize),
    db.select({ total: count() }).from(auditPages).where(where),
  ]);
  return { rows, totalCount: totals[0]?.total ?? 0 };
}

export async function getReportPage(auditId: string, url: string) {
  const [page] = await db
    .select(PAGE_FIELDS)
    .from(auditPages)
    .where(and(eq(auditPages.auditId, auditId), eq(auditPages.url, url)))
    .limit(1);
  if (!page) return null;
  const issues = await db
    .select({
      id: auditIssues.id,
      issueType: auditIssues.issueType,
      severity: auditIssues.severity,
      detailsJson: auditIssues.detailsJson,
    })
    .from(auditIssues)
    .where(eq(auditIssues.pageId, page.id));
  return { page, issues };
}

/** How many pages each Overview line opens. */
export async function getPageHealth(auditId: string) {
  const tally = (condition: SQL | undefined) =>
    sql<number>`coalesce(sum(case when ${condition} then 1 else 0 end), 0)`.mapWith(
      Number,
    );
  const [row] = await db
    .select({
      unusable: tally(SHOW.unusable),
      "not-in-sitemap": tally(SHOW["not-in-sitemap"]),
      "no-description": tally(SHOW["no-description"]),
      "no-structured-data": tally(SHOW["no-structured-data"]),
      "no-share-image": tally(SHOW["no-share-image"]),
      redirects: tally(SHOW.redirects),
      unread: tally(SHOW.unread),
    })
    .from(auditPages)
    .where(eq(auditPages.auditId, auditId));
  return row;
}

/** Why the crawl stopped before reading every page it found, if it did. */
export async function getCrawlStop(auditId: string) {
  const [row] = await db
    .select({
      issueType: auditIssues.issueType,
      detailsJson: auditIssues.detailsJson,
    })
    .from(auditIssues)
    .where(
      and(
        eq(auditIssues.auditId, auditId),
        inArray(auditIssues.issueType, [...CRAWL_STOP_ISSUE_TYPES]),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** The titles of the pages tested for speed: 10 at most. */
export function listTestedPageTitles(auditId: string) {
  return db
    .selectDistinct({ url: auditPages.url, title: auditPages.title })
    .from(auditLighthouseResults)
    .innerJoin(auditPages, eq(auditPages.id, auditLighthouseResults.pageId))
    .where(eq(auditLighthouseResults.auditId, auditId));
}

export async function getPreviousAudit(audit: {
  projectId: string;
  startUrl: string;
  startedAt: string;
}) {
  const [row] = await db
    .select()
    .from(audits)
    .where(
      and(
        eq(audits.projectId, audit.projectId),
        eq(audits.startUrl, audit.startUrl),
        eq(audits.status, AuditStatus.Completed),
        lt(audits.startedAt, audit.startedAt),
      ),
    )
    .orderBy(desc(audits.startedAt))
    .limit(1);
  return row ?? null;
}

/**
 * The issues of one audit that another audit also has, or does not have, on
 * the same pages. A missing issue only counts where the other audit read the
 * page in full: a page that now errors or redirects has not had it fixed.
 */
export function compareIssues({
  auditId,
  otherAuditId,
  inOther,
  skipTypes,
}: {
  auditId: string;
  otherAuditId: string;
  inOther: boolean;
  skipTypes: string[];
}) {
  const page = aliasedTable(auditPages, "page");
  const otherPage = aliasedTable(auditPages, "other_page");
  const otherIssue = aliasedTable(auditIssues, "other_issue");
  const otherIssues = (issueType: SQL) =>
    db
      .select({ id: otherIssue.id })
      .from(otherIssue)
      .where(and(eq(otherIssue.pageId, otherPage.id), issueType));
  const sameIssue = otherIssues(
    eq(otherIssue.issueType, auditIssues.issueType),
  );
  return db
    .select({
      issueType: auditIssues.issueType,
      pages: countDistinct(auditIssues.pageId),
      example: min(auditIssues.pageUrl),
    })
    .from(auditIssues)
    .innerJoin(page, eq(page.id, auditIssues.pageId))
    .innerJoin(
      otherPage,
      and(eq(otherPage.auditId, otherAuditId), eq(otherPage.url, page.url)),
    )
    .where(
      and(
        eq(auditIssues.auditId, auditId),
        eq(page.fetchClass, "ok"),
        eq(otherPage.fetchClass, "ok"),
        skipTypes.length > 0
          ? notInArray(auditIssues.issueType, skipTypes)
          : undefined,
        inOther
          ? exists(sameIssue)
          : and(
              notExists(sameIssue),
              gte(otherPage.statusCode, 200),
              lt(otherPage.statusCode, 300),
              // Content was not checked on a page that needed JavaScript.
              notExists(
                otherIssues(
                  eq(otherIssue.issueType, "javascript-rendering-suspected"),
                ),
              ),
            ),
      ),
    )
    .groupBy(auditIssues.issueType)
    .orderBy(desc(countDistinct(auditIssues.pageId)));
}
