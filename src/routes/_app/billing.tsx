import {
  Link,
  createFileRoute,
  notFound,
  useNavigate,
} from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import { ErrorState } from "@/client/components/ErrorState";
import { PageHeader } from "@/client/components/PageHeader";
import { QueryError } from "@/client/components/QueryState";
import { Alert, AlertDescription } from "@/client/components/ui/alert";
import { Button } from "@/client/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";
import { Field } from "@/client/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/client/components/ui/input-group";
import { Skeleton } from "@/client/components/ui/skeleton";
import { queryClient } from "@/client/tanstack-db";
import { isHostedClientAuthMode } from "@/lib/auth-mode";
import { useCanManageBilling } from "@/client/features/team/organizationQueries";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import { prefetchBillingAccount } from "@/client/features/billing/billingAccountQuery";
import { AutoReloadSettings } from "@/client/features/billing/AutoReloadSettings";
import { ChangePlanButton } from "@/client/features/billing/PlanChange";
import { BillingTabs } from "@/client/features/billing/BillingTabs";
import { CreditsCard } from "@/client/features/billing/CreditsCard";
import { parseTopUpAmount } from "@/client/features/billing/HostedBillingContentUtils";
import { billingUsageQueryOptions } from "@/client/features/billing/useBillingUsage";
import { useCreditBalance } from "@/client/features/billing/useCreditBalance";
import {
  createBillingPortalSession,
  createTopUpCheckout,
} from "@/serverFunctions/billing";
import {
  BILLING_ROUTE,
  BILLING_TABS,
  SUBSCRIBE_ROUTE,
  TOP_UP_MAX_USD,
  TOP_UP_MIN_USD,
  topUpPrice,
} from "@/shared/billing";
import { pageHead } from "@/client/lib/pageHead";

export const Route = createFileRoute("/_app/billing")({
  head: () => pageHead("Billing"),
  validateSearch: z.object({
    tab: z
      .enum(BILLING_TABS.map((item) => item.value))
      .optional()
      .catch(undefined),
  }),
  // The loader fills the module-scoped query client, so keep it out of server
  // requests: one worker isolate must not cache another account's billing.
  ssr: false,
  beforeLoad: () => {
    if (!isHostedClientAuthMode()) {
      throw notFound();
    }
  },
  // Start both reads on link intent and on a full load alongside the session
  // check, without holding up navigation.
  loader: () => {
    prefetchBillingAccount();
    void queryClient.prefetchQuery(billingUsageQueryOptions());
  },
  component: BillingPage,
});

const TOP_UP_PRESETS = ["20", "100", "500", "1000", "5000"];

const formatUsd = (usd: number) =>
  `$${usd.toLocaleString("en-US", { minimumFractionDigits: usd % 1 ? 2 : 0 })}`;

type BillingAction = "plan" | "topUp";

function BillingPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const [topUpAmount, setTopUpAmount] = useState(TOP_UP_PRESETS[0]);
  const [pendingAction, setPendingAction] = useState<BillingAction | null>(
    null,
  );
  const [error, setError] = useState<{
    action: BillingAction;
    message: string;
  } | null>(null);

  const { accountQuery, isFreePlan, autoReloadState } = useCreditBalance();
  const account = accountQuery.data;
  // The budget counts bought credits too, so a purchase now would sit
  // unspent until it is raised; the notice below the button says so.
  const budgetSpent = autoReloadState === "budget_spent";

  // Subscription changes are owner-only; other members see balances but are
  // pointed at the owner instead of checkout (the server enforces this too).
  const canManageBilling = useCanManageBilling();

  const { isValid: isValidTopUp, parsed: parsedTopUpAmount } =
    parseTopUpAmount(topUpAmount);
  const { percentOff, priceUsd } = topUpPrice(parsedTopUpAmount);
  const showTopUpError = topUpAmount.trim() !== "" && !isValidTopUp;

  // Each action ends by sending the browser to Stripe, so the button stays
  // pending unless it fails.
  async function runAction(
    action: BillingAction,
    callback: () => Promise<void>,
    fallbackMessage: string,
  ) {
    setError(null);
    setPendingAction(action);
    try {
      await callback();
    } catch (err) {
      setError({
        action,
        message: getStandardErrorMessage(err, fallbackMessage),
      });
      setPendingAction(null);
    }
  }

  async function startTopUpCheckout() {
    window.location.assign(
      await createTopUpCheckout({ data: { amountUsd: parsedTopUpAmount } }),
    );
  }

  async function openPortal() {
    window.location.assign(
      await createBillingPortalSession({ data: { returnTo: BILLING_ROUTE } }),
    );
  }

  function actionError(action: BillingAction) {
    return error?.action === action ? (
      <ErrorState message={error.message} />
    ) : null;
  }

  return (
    <div className="mx-auto box-content max-w-290 space-y-6 px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-8">
      <PageHeader title="Billing" />

      {accountQuery.isPending ? (
        <BillingSummarySkeleton />
      ) : !account ? (
        <QueryError
          cause={accountQuery.error}
          fallback="We couldn't load your billing details right now. Please try again."
          onRetry={() => void accountQuery.refetch()}
          isRetrying={accountQuery.isFetching}
        />
      ) : (
        <>
          {accountQuery.isError ? (
            <QueryError
              cause={accountQuery.error}
              fallback="Failed to refresh billing details"
              onRetry={() => void accountQuery.refetch()}
              isRetrying={accountQuery.isFetching}
            />
          ) : null}

          {account.isPastDue && canManageBilling ? (
            <Alert variant="destructive">
              <AlertDescription className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 p-2 [&_p]:mb-0!">
                <div>
                  <p className="font-medium text-foreground">
                    Your last payment didn&rsquo;t go through
                  </p>
                  <p>
                    Nothing has been turned off yet. Update your card to keep
                    your plan.
                  </p>
                </div>
                <Button
                  nativeButton={false}
                  className="no-underline!"
                  render={<Link to="/billing/fix-payment" />}
                >
                  Fix payment
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-6 has-[#auto-reload-amount]:items-start has-data-[slot=alert]:items-start lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
            {/* Buying is owner-only. */}
            <CreditsCard>
              {!canManageBilling ? null : (
                <>
                  <h3 className="font-medium">Buy credits</h3>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div
                      role="group"
                      aria-label="Amount"
                      className="flex flex-wrap gap-2"
                    >
                      {TOP_UP_PRESETS.map((preset) => (
                        <Button
                          key={preset}
                          variant="outline"
                          aria-pressed={topUpAmount === preset}
                          className="min-w-14 aria-pressed:border-primary aria-pressed:bg-muted"
                          onClick={() => setTopUpAmount(preset)}
                        >
                          {formatUsd(Number(preset))}
                        </Button>
                      ))}
                    </div>
                    <span className="text-muted-foreground">or</span>
                    <Field data-invalid={showTopUpError} className="w-32">
                      <InputGroup>
                        <InputGroupAddon>$</InputGroupAddon>
                        <InputGroupInput
                          type="number"
                          min={TOP_UP_MIN_USD}
                          max={TOP_UP_MAX_USD}
                          step={1}
                          inputMode="numeric"
                          aria-label="Top-up amount in USD"
                          aria-invalid={showTopUpError}
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                        />
                      </InputGroup>
                    </Field>
                    <Button
                      pending={pendingAction === "topUp"}
                      disabled={
                        !isValidTopUp || pendingAction !== null || budgetSpent
                      }
                      onClick={() =>
                        void runAction(
                          "topUp",
                          startTopUpCheckout,
                          "We couldn't start the checkout. Please try again.",
                        )
                      }
                    >
                      {pendingAction === "topUp"
                        ? "Redirecting to Stripe..."
                        : percentOff > 0
                          ? `Pay ${formatUsd(priceUsd)}`
                          : `Buy ${formatUsd(parsedTopUpAmount)} of credits`}
                    </Button>
                  </div>
                  {isValidTopUp && percentOff > 0 ? (
                    <p role="status">
                      {formatUsd(parsedTopUpAmount)} of credits for{" "}
                      {formatUsd(priceUsd)}. You save {percentOff}%.
                    </p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">
                    Save 5% from $100, 10% from $500, 15% from $1,000, 20% from
                    $2,500 and 25% at $5,000.
                  </p>
                  {showTopUpError ? (
                    <p className="text-sm text-destructive">
                      Enter between {formatUsd(TOP_UP_MIN_USD)} and{" "}
                      {formatUsd(TOP_UP_MAX_USD)}.
                    </p>
                  ) : null}
                  {budgetSpent ? (
                    <p className="text-sm text-muted-foreground">
                      You&rsquo;ve hit your monthly auto-reload budget. Raise it
                      under Auto-reload to buy more.
                    </p>
                  ) : null}
                  {actionError("topUp")}
                </>
              )}
            </CreditsCard>

            <div className="flex min-w-0 flex-col gap-6">
              <Card size="lg">
                <CardHeader>
                  <CardTitle className="font-medium text-foreground/80">
                    <h2>Plan</h2>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xl font-medium tracking-tight">
                      {account.paidPlanId ? account.paidPlanName : "Starter"}
                    </p>
                    {account.paidPlanId ? (
                      <p className="text-muted-foreground">
                        ${account.monthlyCreditsUsd.toFixed(2)} of credits each
                        month
                      </p>
                    ) : canManageBilling ? (
                      <p className="text-muted-foreground">
                        Includes every feature. Upgrade for more credits each
                        month
                      </p>
                    ) : null}
                  </div>
                  {!canManageBilling ? (
                    <p className="text-muted-foreground">
                      Only the organization owner can change the plan or buy
                      credits. Ask them if you need more.
                    </p>
                  ) : isFreePlan ? (
                    <Button
                      nativeButton={false}
                      render={
                        <Link to={SUBSCRIBE_ROUTE} search={{ upgrade: true }} />
                      }
                    >
                      Upgrade Plan
                    </Button>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        pending={pendingAction === "plan"}
                        disabled={pendingAction !== null}
                        onClick={() =>
                          void runAction(
                            "plan",
                            openPortal,
                            "We couldn't open the billing portal. Please try again.",
                          )
                        }
                      >
                        {pendingAction === "plan"
                          ? "Redirecting to Stripe..."
                          : "Manage subscription"}
                      </Button>
                      <ChangePlanButton planId={account.paidPlanId} />
                    </div>
                  )}
                  {actionError("plan")}
                </CardContent>
              </Card>

              {canManageBilling ? <AutoReloadSettings /> : null}
            </div>
          </div>
        </>
      )}

      <BillingTabs
        tab={tab ?? "usage"}
        onTabChange={(next) =>
          void navigate({
            to: BILLING_ROUTE,
            // Like other tabbed pages, Back leaves the page.
            replace: true,
            search: { tab: next === "usage" ? undefined : next },
          })
        }
        invoiceEmailsEnabled={
          canManageBilling && account ? account.invoiceEmailsEnabled : null
        }
      />

      <p className="text-xs text-muted-foreground">
        Billing is powered by Stripe.
      </p>
    </div>
  );
}

/** The summary cards' shape while the billing account loads. */
function BillingSummarySkeleton() {
  return (
    <div
      aria-busy
      className="grid gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]"
    >
      <Skeleton className="h-80 rounded-xl" />
      <div className="flex flex-col gap-6">
        <Skeleton className="h-37 rounded-xl" />
        <Skeleton className="h-37 rounded-xl" />
      </div>
    </div>
  );
}
