import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/client/components/ui/accordion";
import { Button } from "@/client/components/ui/button";
import { DashboardSetupAction } from "@/client/features/dashboard/DashboardSetupAction";
import {
  getStepStatus,
  getVisibleSteps,
} from "@/client/features/dashboard/dashboardSteps";
import { usesBetterAuthClient } from "@/lib/auth-mode";
import type { DashboardActivation } from "@/server/features/dashboard/services/DashboardService";
import type { DashboardSetupStep } from "@/types/schemas/dashboard";
import { useDismissStep } from "./useGetStarted";

export function NextSteps({
  projectId,
  activation,
  onLeave,
}: {
  projectId: string;
  activation: DashboardActivation;
  onLeave: () => void;
}) {
  const dismiss = useDismissStep(projectId);
  const [openSteps, setOpenSteps] = useState<DashboardSetupStep[]>([]);
  const steps = getVisibleSteps(activation, usesBetterAuthClient());
  const todo = steps.filter(
    ({ id }) => getStepStatus(activation, id) === "todo",
  );
  const deferred = steps.filter(
    ({ id }) => getStepStatus(activation, id) === "skipped",
  );
  if (todo.length + deferred.length === 0) return null;

  return (
    <section>
      <h3 className="mb-2 text-base font-medium">Next steps</h3>
      <Accordion value={openSteps} onValueChange={setOpenSteps}>
        {todo.map((step) => (
          <AccordionItem key={step.id} value={step.id}>
            <AccordionTrigger className="min-h-12 items-center text-[15px] font-normal">
              {step.label}
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <DashboardSetupAction
                step={step.id}
                projectId={projectId}
                domain={activation.domain}
                onComplete={onLeave}
              />
              <Button
                variant="ghost"
                className="px-0 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
                disabled={dismiss.isPending}
                onClick={() =>
                  dismiss.mutate({ step: step.id, dismissed: true })
                }
              >
                {step.skipLabel}
              </Button>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {deferred.map((step) => (
        <div
          key={step.id}
          className="flex min-h-12 items-center justify-between gap-3 text-muted-foreground"
        >
          <span>{step.label}</span>
          <Button
            variant="ghost"
            aria-label={`Restore ${step.label}`}
            disabled={dismiss.isPending}
            onClick={() => dismiss.mutate({ step: step.id, dismissed: false })}
          >
            Restore
          </Button>
        </div>
      ))}
    </section>
  );
}
