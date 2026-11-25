import type { ReactNode } from "react";
import { KeyRound } from "lucide-react";
import { GateCard } from "@/client/components/GateCard";
import { QueryError } from "@/client/components/QueryState";
import { SkeletonPageContent } from "@/client/components/SkeletonPresets";
import { Button } from "@/client/components/ui/button";
import { useSamAccess } from "@/client/features/sam/useSamAccess";

/**
 * AI visibility setup researches the brand and suggests prompts through
 * OpenRouter, so a self-hosted install without a key would only fail after
 * the user starts research. Ask for the key first (hosted always has one).
 */
export function OpenRouterKeyGate({
  projectId,
  children,
}: {
  projectId: string;
  children: ReactNode;
}) {
  const access = useSamAccess(projectId);
  if (access.status === "ready") return children;
  if (access.status === "checking") return <SkeletonPageContent />;
  if (access.status === "error")
    return (
      <QueryError
        error={access.error}
        fallback="Could not check AI visibility."
        onRetry={access.onRetry}
        isRetrying={access.isRetrying}
      />
    );
  return (
    <div className="grid min-h-[calc(100dvh-8rem)] place-items-center">
      <GateCard
        className="max-w-2xl"
        icon={KeyRound}
        tone="warning"
        title="AI visibility isn't available right now"
        description={
          <p>
            Please try again later, and contact support if it keeps happening.
          </p>
        }
        actions={
          <Button
            size="lg"
            pending={access.isRefetching}
            onClick={access.onRetry}
          >
            Try again
          </Button>
        }
      />
    </div>
  );
}
