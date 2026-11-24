import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyButton } from "@/client/components/CopyButton";
import { PermissionHint } from "@/client/components/PermissionHint";
import { Button } from "@/client/components/ui/button";
import { ONE_CLICK_INSTALLS } from "@/client/features/ai-mcp/agentInstalls";
import { getAgentSetupPrompt } from "@/client/features/ai-mcp/agentSetupPrompt";
import {
  getSkillsSetupPrompt,
  projectPrompt,
} from "@/client/features/dashboard/DashboardSetupAction";
import { CreateProjectModal } from "@/client/features/projects/CreateProjectModal";
import { InviteTeammateModal } from "@/client/features/team/InviteTeammateModal";
import { organizationContextQueryOptions } from "@/client/features/team/organizationQueries";
import { captureClientEvent } from "@/client/lib/posthog";
import { usesBetterAuthClient } from "@/lib/auth-mode";
import { hasOrgPermission } from "@/lib/org-permissions";
import { listMcpConnections } from "@/serverFunctions/mcp-connections";
import type { DashboardSetupStep } from "@/types/schemas/dashboard";

/** The strip's buttons for the steps that are not a field. */
export function StepActions({
  step,
  domain,
}: {
  step: DashboardSetupStep;
  domain: string | null;
}) {
  if (step === "mcp") {
    return (
      <CopyButton
        variant="default"
        size="default"
        value={getAgentSetupPrompt(window.location.origin)}
        label="Copy setup prompt"
        successMessage="Setup prompt copied"
        onCopy={() =>
          captureClientEvent("onboarding:setup_prompt_copy", {
            source: "dashboard",
          })
        }
      />
    );
  }
  if (step === "skills") return <SkillsActions domain={domain} />;
  if (step === "team" || step === "project") {
    return <ManagedActions step={step} />;
  }
  return null;
}

function SkillsActions({ domain }: { domain: string | null }) {
  const connections = useQuery({
    queryKey: ["mcpConnections"],
    queryFn: () => listMcpConnections(),
    enabled: usesBetterAuthClient(),
  });
  const prompt = getSkillsSetupPrompt(domain);
  const chats = ONE_CLICK_INSTALLS.filter(({ agent }) =>
    connections.data?.some((grant) => grant.webChat === agent),
  );
  return (
    <>
      {chats.map(({ agent, name, newChatUrl, Icon }) => (
        <Button
          key={agent}
          size="default"
          variant={chats.length === 1 ? "default" : "outline"}
          nativeButton={false}
          render={
            <a href={newChatUrl(prompt)} target="_blank" rel="noreferrer" />
          }
          onClick={() =>
            captureClientEvent("dashboard:skills_open_in_agent_click", {
              agent,
            })
          }
        >
          <Icon data-icon="inline-start" />
          Open in {name}
        </Button>
      ))}
      <CopyButton
        value={prompt}
        label="Copy prompt"
        successMessage="Prompt copied"
        variant={chats.length === 0 ? "default" : "outline"}
        size="default"
        onCopy={() => captureClientEvent("dashboard:skills_prompt_copy")}
      />
    </>
  );
}

function ManagedActions({ step }: { step: "team" | "project" }) {
  const queryClient = useQueryClient();
  const org = useQuery(organizationContextQueryOptions());
  const [open, setOpen] = useState(false);
  if (org.isPending) return null;
  const canManage =
    org.data &&
    hasOrgPermission(
      org.data.role,
      step === "project" ? { project: ["create"] } : { invitation: ["create"] },
    );
  if (!canManage) return <PermissionHint action="help with this step" />;
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        {step === "project" ? "Create another project" : "Invite a teammate"}
      </Button>
      {step === "project" ? (
        <CopyButton
          value={projectPrompt}
          label="Copy project prompt"
          successMessage="Project prompt copied"
          variant="outline"
          size="default"
        />
      ) : null}
      {open && step === "project" ? (
        <CreateProjectModal onClose={() => setOpen(false)} />
      ) : null}
      {open && step === "team" ? (
        <InviteTeammateModal
          onClose={() => setOpen(false)}
          onInvited={() => {
            void queryClient.invalidateQueries({
              queryKey: ["organization-team"],
            });
            void queryClient.invalidateQueries({
              queryKey: ["dashboardActivation"],
            });
          }}
        />
      ) : null}
    </>
  );
}
