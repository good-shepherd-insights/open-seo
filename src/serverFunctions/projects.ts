import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireOrgPermission } from "@/server/auth/org-gate";
import { ProjectService } from "@/server/features/projects/services/ProjectService";
import { captureMetaSetupStep, MetaSetupEvent } from "@/server/referrals/meta";
import {
  requireAuthenticatedContext,
  requireProjectContext,
} from "@/serverFunctions/middleware";
import {
  archiveProjectSchema,
  createProjectSchema,
  archivedProjectSchema,
  setProjectWebsiteSchema,
  updateProjectSchema,
} from "@/types/schemas/projects";
import { z } from "zod";

const projectScopedSchema = z.object({ projectId: z.string().min(1) });

export const getProjects = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .handler(async ({ context }) =>
    ProjectService.listProjectsEnsuringOne(context.organizationId),
  );

export const createProject = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator(createProjectSchema)
  .handler(async ({ data, context }) => {
    requireOrgPermission(context, { project: ["create"] });
    const project = await ProjectService.createProject(
      context.organizationId,
      data,
    );
    if (project.domain) {
      await captureMetaSetupStep(
        MetaSetupEvent.WebsiteAdded,
        context.organizationId,
        getRequest(),
      );
    }
    return project;
  });

export const updateProject = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(updateProjectSchema)
  .handler(async ({ data, context }) => {
    const project = await ProjectService.updateProject(
      context.organizationId,
      data,
    );
    if (project.domain && !context.project.domain) {
      await captureMetaSetupStep(
        MetaSetupEvent.WebsiteAdded,
        context.organizationId,
        getRequest(),
      );
    }
    return project;
  });

// Onboarding's website step.
export const saveOnboardingWebsite = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(setProjectWebsiteSchema)
  .handler(async ({ data, context }) => {
    const project = await ProjectService.updateProject(context.organizationId, {
      ...data,
      // Name the auto-created project after the site it now tracks.
      name:
        context.project.name === "Default" ? data.domain : context.project.name,
    });
    if (!context.project.domain) {
      await captureMetaSetupStep(
        MetaSetupEvent.WebsiteAdded,
        context.organizationId,
        getRequest(),
      );
    }
    return project;
  });

export const archiveProject = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(archiveProjectSchema)
  .handler(async ({ data, context }) => {
    requireOrgPermission(context, { project: ["delete"] });
    return ProjectService.archiveProject(context.organizationId, data);
  });

export const getArchivedProjects = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .handler(async ({ context }) =>
    ProjectService.listArchivedProjects(context.organizationId),
  );

export const restoreProject = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator(archivedProjectSchema)
  .handler(async ({ data, context }) => {
    requireOrgPermission(context, { project: ["delete"] });
    return ProjectService.restoreProject(context.organizationId, data);
  });

export const deleteArchivedProject = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator(archivedProjectSchema)
  .handler(async ({ data, context }) => {
    requireOrgPermission(context, { project: ["delete"] });
    return ProjectService.deleteArchivedProject(context.organizationId, data);
  });

export const getProjectAccess = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator(projectScopedSchema)
  .handler(async ({ data, context }) => {
    return ProjectService.getProjectForOrganization(
      context.organizationId,
      data.projectId,
    );
  });
