import { LOGO_PATH, PRODUCT_NAME } from "@/shared/branding";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { QueryError } from "@/client/components/QueryState";
import { StatusScreen } from "@/client/components/StatusScreen";
import {
  billingAccountQueryOptions,
  prefetchBillingAccount,
} from "@/client/features/billing/billingAccountQuery";
import {
  openUpgradeCheckout,
  prefetchUpgradeCheckout,
} from "@/client/features/billing/checkout";
import { AnnualPlanDialog } from "@/client/features/billing/AnnualPlanDialog";
import { PlanChangeAction } from "@/client/features/billing/PlanChange";
import { UpgradePlanDialog } from "@/client/features/billing/UpgradePlanDialog";
import { PlanPageAccountMenu } from "@/client/features/billing/PlanPageAccountMenu";
import {
  PlanDetails,
  PlanOfferCard,
} from "@/client/features/billing/PlanOfferCard";
import {
  TIERS,
  isTier,
  type Tier,
} from "@/client/features/billing/subscribe-tiers";
import { captureClientEvent } from "@/client/lib/posthog";
import { useSession } from "@/lib/auth-client";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import { getSubscribeRouteState } from "@/client/features/billing/route-state";
import { normalizeAuthRedirect } from "@/lib/auth-redirect";
import { useCanManageBilling } from "@/client/features/team/organizationQueries";
import { SUPPORT_EMAIL } from "@/client/lib/support";
import { Badge } from "@/client/components/ui/badge";
import { Button } from "@/client/components/ui/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/client/components/ui/toggle-group";
import { pageHead } from "@/client/lib/pageHead";
import { isMonthlyPlan } from "@/shared/billing";

// How long the post-checkout "finalizing" screen polls Autumn before giving
// up and letting the user through anyway, and how often it polls.
const FINALIZING_TIMEOUT_MS = 30_000;
const FINALIZING_POLL_MS = 1000;

// The billing period switch is a segmented control: the chosen period sits
// raised on the muted track.
const PERIOD_ITEM_CLASS =
  "h-8 gap-2 rounded-md! px-3 text-muted-foreground hover:bg-transparent aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm";

export const Route = createFileRoute("/_authenticated/subscribe")({
  head: () => pageHead("Choose a plan"),
  // The loader fills the module-scoped query client, so keep it out of server
  // requests: one worker isolate must not cache another account's billing.
  ssr: false,
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    upgrade?: true;
    redirect?: string;
    checkout?: "success";
    plan?: Tier;
    billing?: "yearly";
  } => ({
    upgrade:
      search.upgrade === true || search.upgrade === "true" ? true : undefined,
    redirect:
      typeof search.redirect === "string"
        ? normalizeAuthRedirect(search.redirect)
        : undefined,
    checkout: search.checkout === "success" ? "success" : undefined,
    plan: isTier(search.plan) ? search.plan : undefined,
    billing: search.billing === "yearly" ? "yearly" : undefined,
  }),
  loaderDeps: ({ search: { upgrade, checkout, plan, billing } }) => ({
    upgrade,
    checkout,
    plan,
    billing,
  }),
  // Start the billing read alongside the session check, not after it. Upgrade
  // links outside Billing land here with ?upgrade=true, and hovering one
  // preloads this route, so the checkout link starts before the click.
  loader: ({ deps }) => {
    prefetchBillingAccount();
    if (deps.upgrade && deps.checkout !== "success") {
      prefetchUpgradeCheckout(
        checkoutPlanId(deps.plan ?? "base", deps.billing === "yearly"),
      );
    }
  },
  component: SubscribePage,
});

// Maryland Insights has no annual price yet, so the yearly switch stays hidden
// rather than advertising a price that was never set.
const ANNUAL_OFFERED = Object.values(TIERS).some(
  (tier) => tier.annual !== null,
);

function checkoutPlanId(tier: Tier, yearly: boolean) {
  const { annual, offer } = TIERS[tier];
  return yearly && annual ? annual.planId : offer.planId;
}

function SubscribePage() {
  const navigate = useNavigate();
  const {
    upgrade: isUpgradeFlow,
    redirect,
    checkout,
    plan: requestedPlan,
    billing,
  } = Route.useSearch();
  const { data: session } = useSession();
  // The plan whose checkout is opening, so only its button spins.
  const [attachingPlan, setAttachingPlan] = useState<Tier | null>(null);
  // The pricing page's Yearly switch carries over with ?billing=yearly.
  const [yearly, setYearly] = useState(ANNUAL_OFFERED && billing === "yearly");
  // The yearly dialog, for a subscriber who picks a yearly plan, keeps its
  // last plan so its text doesn't blank out while it animates closed.
  const [annualPlan, setAnnualPlan] = useState<Tier>("base");
  const [annualDialogOpen, setAnnualDialogOpen] = useState(false);
  // Kept after closing, like the yearly dialog's plan.
  const [upgradeTier, setUpgradeTier] = useState<Tier>("base");
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalizingTimedOut, setFinalizingTimedOut] = useState(false);
  const checkoutCompleted = checkout === "success";

  const accountQuery = useQuery({
    ...billingAccountQueryOptions(),
    // Autumn can lag Stripe by a few seconds after checkout; poll until the
    // subscription shows up so the just-paid user isn't shown the paywall
    // again. An interval never cancels a read in flight, unlike refetch().
    refetchInterval: (query) =>
      checkoutCompleted &&
      !finalizingTimedOut &&
      query.state.data?.planStatus !== "paid"
        ? FINALIZING_POLL_MS
        : false,
  });
  const account = accountQuery.data;
  const paidPlanId = account?.paidPlanId ?? null;
  const paidPlanName = account?.paidPlanName ?? null;

  // Checkout is owner-only; other members hitting the paywall are pointed at
  // their organization owner instead of a Subscribe button that would 403.
  const canManageBilling = useCanManageBilling();

  const subscribeRouteState = getSubscribeRouteState({
    isCustomerLoading: accountQuery.isPending,
    isCustomerError: accountQuery.isError,
    hasCustomerData: account !== undefined,
    hasManagedAccess: account?.hasManagedAccess ?? false,
    planStatus: account?.planStatus ?? "free",
    isUpgradeFlow: isUpgradeFlow === true,
    isPlanChange:
      isMonthlyPlan(paidPlanId) &&
      (isUpgradeFlow === true || requestedPlan !== undefined),
    checkoutCompleted,
    finalizingTimedOut,
  });
  const isChangingPlan = subscribeRouteState === "changePlan";
  const highlightedPlan = requestedPlan ?? null;

  // Armed once on landing with checkout=success (not on the finalizing state,
  // which a refetch with no cached data can leave for "loading" and re-enter)
  // so the deadline is a hard bound from arrival.
  useEffect(() => {
    if (!checkoutCompleted || finalizingTimedOut) return;
    const timeout = setTimeout(
      () => setFinalizingTimedOut(true),
      FINALIZING_TIMEOUT_MS,
    );
    return () => clearTimeout(timeout);
  }, [checkoutCompleted, finalizingTimedOut]);

  useEffect(() => {
    if (subscribeRouteState === "redirectToApp") {
      if (checkoutCompleted) {
        captureClientEvent("billing:checkout_success");
      } else if (requestedPlan && paidPlanId) {
        // A paying customer whose plan changes through support (yearly, or
        // granted by hand) followed a pricing-page plan link; say so
        // instead of a silent redirect.
        const wanted = TIERS[requestedPlan].offer;
        toast.info(
          paidPlanId === wanted.planId
            ? `You're already on the ${wanted.name}`
            : `You're on the ${paidPlanName}`,
          {
            id: "subscribe-plan-switch",
            description:
              paidPlanId === wanted.planId
                ? undefined
                : `To switch to the ${wanted.name}, email ${SUPPORT_EMAIL}.`,
            duration: 10_000,
          },
        );
      }
      void navigate({ href: redirect ?? "/", replace: true });
    }
  }, [
    checkoutCompleted,
    navigate,
    paidPlanId,
    paidPlanName,
    redirect,
    requestedPlan,
    subscribeRouteState,
  ]);

  useEffect(() => {
    if (subscribeRouteState === "showPaywall" && !isUpgradeFlow) {
      captureClientEvent("billing:paywall_viewed");
    }
  }, [isUpgradeFlow, subscribeRouteState]);

  if (
    subscribeRouteState === "loading" ||
    subscribeRouteState === "redirectToApp"
  ) {
    return <StatusScreen pending />;
  }

  if (subscribeRouteState === "finalizing") {
    return (
      <StatusScreen
        logo
        size="sm"
        title="Finalizing your subscription…"
        pending
        description="This usually takes a few seconds."
        footer={
          <>
            Taking longer?{" "}
            <a
              className="underline underline-offset-2 hover:text-foreground"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              Email {SUPPORT_EMAIL}
            </a>
            .
          </>
        }
      />
    );
  }

  if (subscribeRouteState === "error") {
    return (
      <StatusScreen logo title="Billing unavailable" size="sm">
        <QueryError
          cause={accountQuery.error}
          fallback="We couldn't verify your billing status right now. Please try again."
          onRetry={() => void accountQuery.refetch()}
          isRetrying={accountQuery.isFetching}
        />
      </StatusScreen>
    );
  }

  async function handleSubscribe(tier: Tier) {
    setError(null);
    setAttachingPlan(tier);

    try {
      await openUpgradeCheckout(checkoutPlanId(tier, yearly));
    } catch (err) {
      setError(
        getStandardErrorMessage(
          err,
          "We couldn't start the checkout. Please try again.",
        ),
      );
      setAttachingPlan(null);
    }
  }

  function openAnnualDialog(tier: Tier) {
    setAnnualPlan(tier);
    setAnnualDialogOpen(true);
    captureClientEvent("billing:annual_plan_interest", {
      planId: TIERS[tier].offer.planId,
    });
  }

  const firstName = session?.user?.name?.split(" ")[0] || "";
  const annualPriceUsd = TIERS[annualPlan].annual?.priceUsd;

  return (
    // The top padding clears the pinned Back to app and account buttons.
    <div className="w-full max-w-[70rem] space-y-9 pt-12 pb-4">
      {/* Pinned like the account menu across from it, at the same height. */}
      {isUpgradeFlow ? (
        <div className="fixed top-4 left-4 z-20">
          <Button
            variant="ghost"
            onClick={() => void navigate({ to: "/", replace: true })}
          >
            <ChevronLeft />
            Back to app
          </Button>
        </div>
      ) : null}
      <PlanPageAccountMenu email={session?.user?.email} />

      <div className="space-y-6">
        <div className="mx-auto max-w-xl space-y-3 text-center">
          <img
            src={LOGO_PATH}
            alt={PRODUCT_NAME}
            className="mx-auto mb-4 size-14 rounded-xl bg-white p-1.5"
          />
          <h1 className="text-3xl font-medium tracking-tight text-balance">
            {isChangingPlan
              ? "Change your plan"
              : isUpgradeFlow
                ? "Upgrade your plan"
                : firstName
                  ? `Welcome to ${PRODUCT_NAME}, ${firstName}!`
                  : `Welcome to ${PRODUCT_NAME}!`}
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            SEO on your terms. All your SEO tools in one place at a fair price.
          </p>
        </div>

        {ANNUAL_OFFERED ? (
          <ToggleGroup
            spacing={0}
            value={[yearly ? "yearly" : "monthly"]}
            onValueChange={(next) => {
              // A press on the active item empties the group. Keep one item on.
              if (next[0]) setYearly(next[0] === "yearly");
            }}
            className="mx-auto rounded-lg bg-foreground/[0.06] p-1"
            aria-label="Billing period"
          >
            <ToggleGroupItem value="monthly" className={PERIOD_ITEM_CLASS}>
              Monthly
            </ToggleGroupItem>
            <ToggleGroupItem value="yearly" className={PERIOD_ITEM_CLASS}>
              Yearly
              <Badge variant="soft">2 months free</Badge>
            </ToggleGroupItem>
          </ToggleGroup>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {Object.keys(TIERS)
          .filter(isTier)
          .map((tier) => {
            const { offer, annual, description } = TIERS[tier];
            return (
              <PlanOfferCard
                key={tier}
                offer={offer}
                description={description}
                priceUsd={yearly && annual ? annual.priceUsd : offer.priceUsd}
                period={yearly && annual ? "year" : "month"}
                highlighted={
                  isChangingPlan
                    ? offer.planId === paidPlanId
                    : tier === highlightedPlan
                }
              >
                {!canManageBilling ? null : isChangingPlan ? (
                  <PlanChangeAction
                    offer={offer}
                    currentPlanId={paidPlanId}
                    highlighted
                    yearly={yearly}
                    onUpgrade={() => {
                      setUpgradeTier(tier);
                      setUpgradeDialogOpen(true);
                    }}
                    onSwitchToYearly={() => openAnnualDialog(tier)}
                  />
                ) : (
                  <Button
                    className="w-full"
                    pending={attachingPlan === tier}
                    // One checkout at a time: a second one would replace the first.
                    disabled={attachingPlan !== null}
                    onClick={() => void handleSubscribe(tier)}
                  >
                    {attachingPlan === tier ? "Redirecting..." : "Subscribe"}
                  </Button>
                )}
              </PlanOfferCard>
            );
          })}
      </div>

      {error || !canManageBilling ? (
        <div className="mx-auto max-w-md space-y-2 text-center text-sm">
          {error ? (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          ) : null}
          {canManageBilling ? null : (
            <p className="text-muted-foreground">
              {isChangingPlan
                ? "Only the organization owner can change the plan. Ask them if you need a bigger one."
                : "Only the organization owner can subscribe. Ask them to upgrade this organization."}
            </p>
          )}
        </div>
      ) : null}

      <PlanDetails />

      {annualPriceUsd !== undefined ? (
        <AnnualPlanDialog
          open={annualDialogOpen}
          onOpenChange={setAnnualDialogOpen}
          planName={TIERS[annualPlan].offer.name}
          annualPriceUsd={annualPriceUsd}
        />
      ) : null}

      {isChangingPlan ? (
        <UpgradePlanDialog
          open={upgradeDialogOpen}
          onOpenChange={setUpgradeDialogOpen}
          offer={TIERS[upgradeTier].offer}
        />
      ) : null}
    </div>
  );
}
