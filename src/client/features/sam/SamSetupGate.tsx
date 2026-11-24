import { ShieldAlert, Wrench } from "lucide-react";
import { GateCard } from "@/client/components/GateCard";
import { Alert, AlertDescription } from "@/client/components/ui/alert";
import { Button } from "@/client/components/ui/button";

export function SamSetupGate({
  errorMessage,
  isRefetching,
  onRetry,
}: {
  errorMessage: string | null;
  isRefetching: boolean;
  onRetry: () => void;
}) {
  return (
    <GateCard
      icon={Wrench}
      tone="warning"
      title="SAM isn't available right now"
      description={
        <p>
          Please try again later, and contact support if it keeps happening.
        </p>
      }
      actions={
        <Button size="lg" pending={isRefetching} onClick={onRetry}>
          Try again
        </Button>
      }
    >
      {errorMessage ? (
        <Alert variant="warning">
          <ShieldAlert />
          <AlertDescription className="text-foreground">
            {errorMessage}
          </AlertDescription>
        </Alert>
      ) : null}
    </GateCard>
  );
}
