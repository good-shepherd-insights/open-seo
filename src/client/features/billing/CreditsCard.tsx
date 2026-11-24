import type { ReactNode } from "react";
import { CircleAlert, TriangleAlert } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";
import { BASE_PLAN_OFFER } from "@/client/features/billing/plan-offers";
import { useCreditBalance } from "@/client/features/billing/useCreditBalance";

/** What is left to spend: the total, then a bar of the monthly credits and
 *  the top-up credits. `children` (buying more) sits under it. */
export function CreditsCard({ children }: { children?: ReactNode }) {
  const {
    accountQuery,
    isFreePlan,
    monthlyRemaining,
    topUpRemaining,
    totalRemaining,
    isOutOfCredits,
    isLowCredits,
    refillDate,
  } = useCreditBalance();
  const monthlyCreditsUsd = accountQuery.data?.monthlyCreditsUsd ?? 0;
  // Credits carried over from an upgrade can top the allowance.
  const barUsd = Math.max(monthlyCreditsUsd, monthlyRemaining) + topUpRemaining;
  const share = (usd: number) => `${barUsd > 0 ? (usd / barUsd) * 100 : 0}%`;

  return (
    <Card size="lg">
      <CardHeader>
        <CardTitle className="font-medium text-foreground/80">
          <h2>Credits left</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-5xl tracking-tight">${totalRemaining.toFixed(2)}</p>
        {isOutOfCredits ? (
          <p className="flex gap-1.5 text-red-700 dark:text-destructive">
            <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            {isFreePlan
              ? "You’ve used your free credits. Upgrade your plan to continue."
              : `You’ve used this month’s credits. Buy more below to keep going${
                  refillDate
                    ? `, or wait for them to refill on ${refillDate}`
                    : ""
                }.`}
          </p>
        ) : isLowCredits ? (
          <p className="flex gap-1.5 text-amber-700 dark:text-amber-500">
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              You&rsquo;re running low on credits.{" "}
              {isFreePlan
                ? `Upgrade to get $${BASE_PLAN_OFFER.monthlyCreditsUsd}/month.`
                : "Buy more credits below."}
            </span>
          </p>
        ) : isFreePlan ? (
          <p className="text-muted-foreground">
            Your free credits don&rsquo;t refill.
          </p>
        ) : null}

        {isFreePlan ? null : (
          <>
            <div
              aria-hidden
              className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-foreground/10"
            >
              <div
                className="bg-primary"
                style={{ width: share(monthlyRemaining) }}
              />
              <div
                className="bg-foreground/60"
                style={{ width: share(topUpRemaining) }}
              />
            </div>
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <Balance
                swatch="bg-primary"
                label="Monthly credits"
                note={refillDate ? `Refills ${refillDate}` : null}
              >
                ${monthlyRemaining.toFixed(2)}
                {monthlyCreditsUsd > 0
                  ? ` of $${monthlyCreditsUsd.toFixed(2)}`
                  : ""}
              </Balance>
              <Balance
                swatch="bg-foreground/60"
                label="Top-up credits"
                note="Used after monthly credits. Never expire."
              >
                ${topUpRemaining.toFixed(2)}
              </Balance>
            </div>
          </>
        )}
        {children ? (
          <div className="space-y-3 border-t border-border pt-5">
            {children}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Balance({
  swatch,
  label,
  note,
  children,
}: {
  swatch: string;
  label: string;
  note: string | null;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-2">
        <span aria-hidden className={`size-2.5 rounded-sm ${swatch}`} />
        {label}
      </p>
      <p className="tabular-nums">{children}</p>
      {note ? <p className="text-muted-foreground">{note}</p> : null}
    </div>
  );
}
