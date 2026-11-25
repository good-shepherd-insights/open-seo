import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { CopyButton } from "@/client/components/CopyButton";
import { Button } from "@/client/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";
import { captureClientEvent } from "@/client/lib/posthog";
import { usesBetterAuthClient } from "@/lib/auth-mode";
import { listMcpConnections } from "@/serverFunctions/mcp-connections";
import { getAgents, type Agent } from "./agentLinks";

const APP_OPENS_WITHIN_MS = 15_000;

/** Each agent's own way to add our MCP server, and whether it is connected. */
export function ConnectAgents({ mcpUrl }: { mcpUrl: string }) {
  const [opened, setOpened] = useState<{ name: string; at: number } | null>(
    null,
  );
  const connections = useQuery({
    queryKey: ["mcpConnections"],
    queryFn: () => listMcpConnections(),
    enabled: usesBetterAuthClient(),
    // Someone is adding one now: notice when they come back signed in.
    refetchInterval: opened === null ? false : 3_000,
  });
  return (
    <Card size="lg">
      <CardHeader>
        <CardTitle>
          <h2>Connect your agent</h2>
        </CardTitle>
        <CardDescription>
          Pick the one you use. Where there’s an Add button, it opens with
          everything filled in. You approve it, then sign in here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {getAgents(mcpUrl).map((agent) => (
          <AgentRow
            key={agent.name}
            agent={agent}
            connected={connections.data?.some(agent.isConnected) ?? false}
            openedAt={opened?.name === agent.name ? opened.at : null}
            onOpen={(open) =>
              setOpened(open ? { name: agent.name, at: Date.now() } : null)
            }
          />
        ))}
      </CardContent>
    </Card>
  );
}

function AgentRow({
  agent,
  connected,
  openedAt,
  onOpen,
}: {
  agent: Agent;
  connected: boolean;
  openedAt: number | null;
  onOpen: (open: boolean) => void;
}) {
  const onAdd = (next: boolean) => {
    onOpen(next);
    if (next)
      captureClientEvent("mcp:add_to_agent_click", { agent: agent.name });
  };
  return (
    <div className="border-t border-border py-3 text-[15px] first:border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-56">
          <p className="font-medium">{agent.name}</p>
          <p className="text-sm text-muted-foreground">{agent.note}</p>
        </div>
        {connected ? (
          <p
            role="status"
            className="inline-flex min-h-11 items-center gap-1.5 text-success"
          >
            <Check className="size-4" aria-hidden />
            Connected
          </p>
        ) : agent.kind === "link" ? (
          <Button
            nativeButton={false}
            render={
              <a
                href={agent.href}
                target={agent.href.startsWith("https") ? "_blank" : undefined}
                rel="noreferrer"
              />
            }
            onClick={() => onAdd(true)}
          >
            Add to {agent.name}
          </Button>
        ) : (
          <Button
            variant="outline"
            aria-expanded={openedAt !== null}
            onClick={() => onAdd(openedAt === null)}
          >
            {agent.kind === "command" ? "Show command" : "Show steps"}
          </Button>
        )}
      </div>
      {openedAt !== null && !connected ? (
        // A new press starts the wait again.
        <ByHand key={openedAt} agent={agent} />
      ) : null}
    </div>
  );
}

function ByHand({ agent }: { agent: Agent }) {
  const [late, setLate] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLate(true), APP_OPENS_WITHIN_MS);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="mt-3 flex flex-col gap-2.5 rounded-lg bg-background px-4 py-3.5 text-sm">
      <p role="status" className="text-muted-foreground">
        {agent.kind === "command"
          ? "Run this, then sign in when it asks."
          : agent.kind === "steps"
            ? "Copy this address, then:"
            : late
              ? `${agent.name} didn’t open? Make sure it’s installed, or add it yourself:`
              : `Waiting for you to approve it in ${agent.name}. If nothing opened, add it yourself:`}
      </p>
      {agent.kind === "steps" ? (
        <ol className="list-inside list-decimal space-y-2.5">
          {agent.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}
      <div className="flex flex-wrap items-center gap-2.5">
        <code className="min-w-0 flex-1 basis-64 font-mono wrap-anywhere">
          {agent.code}
        </code>
        <CopyButton
          value={agent.code}
          size="default"
          successMessage="Copied"
          onCopy={() => captureClientEvent("mcp:setup_url_copy")}
        />
        {agent.kind === "steps" ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href={agent.href} target="_blank" rel="noreferrer" />}
          >
            Open {agent.name}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
