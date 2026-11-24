import {
  AUTUMN_AGENCY_PLAN_ID,
  AUTUMN_PAID_PLAN_ID,
  AUTUMN_PRO_PLAN_ID,
  type CheckoutPlanId,
} from "@/shared/billing";

// What a checkout page advertises before the customer holds the plan. Once
// they do, everything shown about it comes from the Autumn customer (see
// billing-account.ts), so these only need to match the Autumn plans they sell.
export type PlanOffer = {
  planId: CheckoutPlanId;
  name: string;
  priceUsd: number;
  /** Null until the plan's credits are decided. */
  monthlyCreditsUsd: number | null;
};

export const BASE_PLAN_OFFER = {
  planId: AUTUMN_PAID_PLAN_ID,
  name: "Base Plan",
  priceUsd: 199.99,
  monthlyCreditsUsd: 200,
} satisfies PlanOffer;

export const GROWTH_PLAN_OFFER: PlanOffer = {
  planId: AUTUMN_PRO_PLAN_ID,
  name: "Growth Plan",
  priceUsd: 499.99,
  monthlyCreditsUsd: null,
};

export const ULTIMATE_PLAN_OFFER: PlanOffer = {
  planId: AUTUMN_AGENCY_PLAN_ID,
  name: "Ultimate Plan",
  priceUsd: 999.99,
  monthlyCreditsUsd: null,
};

export function monthlyCreditsFeature(offer: PlanOffer) {
  return offer.monthlyCreditsUsd === null
    ? "Includes more Usage Credits each month"
    : `Includes $${offer.monthlyCreditsUsd.toFixed(2)} of Usage Credits each month`;
}
