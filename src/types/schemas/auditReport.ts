import { z } from "zod";
import { getAuditPagesSchema } from "@/types/schemas/audit";

export const AUDIT_REPORT_SHOW = [
  "all",
  "problems",
  "unusable",
  "not-in-sitemap",
  "no-description",
  "no-structured-data",
  "no-share-image",
  "redirects",
  "unread",
  "speed-tested",
] as const;
export type AuditReportShow = (typeof AUDIT_REPORT_SHOW)[number];

export const AUDIT_REPORT_SORTS = [
  "url",
  "statusCode",
  "problems",
  "indexable",
  "responseTimeMs",
  "mobileScore",
  "desktopScore",
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
] as const;
export type AuditReportSort = (typeof AUDIT_REPORT_SORTS)[number];

export const getAuditReportPagesSchema = getAuditPagesSchema.extend({
  sort: z.enum(AUDIT_REPORT_SORTS).default("problems"),
  order: z.enum(["asc", "desc"]).default("desc"),
  show: z.enum(AUDIT_REPORT_SHOW).default("all"),
});

export const auditReportSchema = z.object({
  projectId: z.string().min(1),
  auditId: z.string().min(1),
});

export const getAuditReportPageSchema = auditReportSchema.extend({
  url: z.string().min(1).max(2048),
});
