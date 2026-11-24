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
  monthlyCreditsUsd: number;
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
  monthlyCreditsUsd: 500,
};

export const ULTIMATE_PLAN_OFFER: PlanOffer = {
  planId: AUTUMN_AGENCY_PLAN_ID,
  name: "Ultimate Plan",
  priceUsd: 999.99,
  monthlyCreditsUsd: 1000,
};

export function monthlyCreditsFeature(offer: PlanOffer) {
  const usd = offer.monthlyCreditsUsd.toLocaleString("en-US", {
    minimumFractionDigits: 2,
  });
  return `Includes $${usd} of Usage Credits each month`;
}
