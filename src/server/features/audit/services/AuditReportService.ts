import { sortBy } from "remeda";
import type { z } from "zod";
import { AuditRepository } from "@/server/features/audit/repositories/AuditRepository";
import {
  compareIssues,
  getCrawlStop,
  getPageHealth,
  getPreviousAudit,
  getReportPage,
  listReportPages,
  listTestedPageTitles,
} from "@/server/features/audit/repositories/auditReportQueries";
import { listAuditLighthouseResults } from "@/server/features/audit/repositories/auditResultsQueries";
import { getIssueTypePageCountsForAudit } from "@/server/features/audit/repositories/auditSummaryQueries";
import { parseAuditConfig } from "@/server/lib/audit/types";
import { AppError } from "@/server/lib/errors";
import { readStoredLighthousePayload } from "@/server/lib/lighthousePayload";
import { getJsonFromR2 } from "@/server/lib/r2";
import { AuditStatus } from "@/shared/audit-status";
import type { getAuditReportPagesSchema } from "@/types/schemas/auditReport";

type Audit = NonNullable<
  Awaited<ReturnType<typeof AuditRepository.getAuditForProject>>
>;

// Found by looking across pages, so they come and go with what was crawled.
const CROSS_PAGE_ISSUE_TYPES = [
  "orphan-page",
  "broken-internal-link",
  "duplicate-title",
  "duplicate-meta-description",
  "duplicate-content",
  "redirect-chain",
  "redirect-loop",
];

async function requireAudit(auditId: string, projectId: string) {
  const audit = await AuditRepository.getAuditForProject(auditId, projectId);
  if (!audit) throw new AppError("NOT_FOUND");
  return audit;
}

async function readWholeSite(audit: Audit) {
  const excludePaths = parseAuditConfig(audit.config)?.excludePaths ?? [];
  return (
    audit.status === AuditStatus.Completed &&
    excludePaths.length === 0 &&
    (await getCrawlStop(audit.id)) === null
  );
}

async function getChanges(audit: Audit) {
  const previous = await getPreviousAudit(audit);
  if (!previous) return null;
  const [whole, previousWhole] = await Promise.all([
    readWholeSite(audit),
    readWholeSite(previous),
  ]);
  const skipTypes = whole && previousWhole ? [] : CROSS_PAGE_ISSUE_TYPES;
  const now = { auditId: audit.id, otherAuditId: previous.id, skipTypes };
  const before = { auditId: previous.id, otherAuditId: audit.id, skipTypes };
  const [fixed, added, still] = await Promise.all([
    compareIssues({ ...before, inOther: false }),
    compareIssues({ ...now, inOther: false }),
    compareIssues({ ...now, inOther: true }),
  ]);
  return { previousStartedAt: previous.startedAt, fixed, added, still };
}

async function getOverview(auditId: string, projectId: string) {
  const audit = await requireAudit(auditId, projectId);
  const [issueTypes, health, crawlStop, testedPages, changes] =
    await Promise.all([
      getIssueTypePageCountsForAudit(auditId),
      getPageHealth(auditId),
      getCrawlStop(auditId),
      listTestedPageTitles(auditId),
      getChanges(audit),
    ]);
  return { issueTypes, health, crawlStop, testedPages, changes };
}

async function getPages(
  input: Omit<z.output<typeof getAuditReportPagesSchema>, "projectId">,
  projectId: string,
) {
  const { auditId, ...params } = input;
  await requireAudit(auditId, projectId);
  return listReportPages(auditId, params);
}

async function getPage(auditId: string, url: string, projectId: string) {
  await requireAudit(auditId, projectId);
  const result = await getReportPage(auditId, url);
  if (!result) throw new AppError("NOT_FOUND");
  return result;
}

/** What the mobile tests say slows the pages, the most common first. */
async function getSpeedCauses(auditId: string, projectId: string) {
  await requireAudit(auditId, projectId);
  const results = await listAuditLighthouseResults(auditId);
  const causes = new Map<
    string,
    { key: string; title: string; description: string; pages: number }
  >();
  let testedPages = 0;
  await Promise.all(
    results.map(async ({ strategy, r2Key }) => {
      if (strategy !== "mobile" || !r2Key) return;
      const payload = await getJsonFromR2(r2Key);
      const { report } = readStoredLighthousePayload(payload, "performance");
      if (!report.hasIssueDetails) return;
      testedPages += 1;
      for (const { auditKey, title, description } of report.issues) {
        const cause = causes.get(auditKey);
        if (cause) cause.pages += 1;
        else {
          causes.set(auditKey, { key: auditKey, title, description, pages: 1 });
        }
      }
    }),
  );
  return {
    testedPages,
    causes: sortBy([...causes.values()], [(cause) => cause.pages, "desc"]),
  };
}

export const AuditReportService = {
  getOverview,
  getPages,
  getPage,
  getSpeedCauses,
} as const;
