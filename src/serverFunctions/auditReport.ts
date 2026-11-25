import { createServerFn } from "@tanstack/react-start";
import { AuditReportService } from "@/server/features/audit/services/AuditReportService";
import { requireProjectContext } from "@/serverFunctions/middleware";
import {
  auditReportSchema,
  getAuditReportPageSchema,
  getAuditReportPagesSchema,
} from "@/types/schemas/auditReport";

export const getAuditReportOverview = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(auditReportSchema)
  .handler(({ data, context }) =>
    AuditReportService.getOverview(data.auditId, context.projectId),
  );

export const getAuditReportPages = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(getAuditReportPagesSchema)
  .handler(({ data, context }) => {
    const { projectId: _projectId, ...input } = data;
    return AuditReportService.getPages(input, context.projectId);
  });

export const getAuditReportPage = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(getAuditReportPageSchema)
  .handler(({ data, context }) =>
    AuditReportService.getPage(data.auditId, data.url, context.projectId),
  );

export const getAuditSpeedCauses = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(auditReportSchema)
  .handler(({ data, context }) =>
    AuditReportService.getSpeedCauses(data.auditId, context.projectId),
  );
