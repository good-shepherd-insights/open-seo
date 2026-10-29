import {
  AUTUMN_AGENCY_PLAN_ID,
  AUTUMN_PAID_PLAN_ID,
  AUTUMN_PRO_PLAN_ID,
  AUTUMN_YC_PLAN_ID,
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

export const BASE_PLAN_OFFER: PlanOffer = {
  planId: AUTUMN_PAID_PLAN_ID,
  name: "Base Plan",
  priceUsd: 199.99,
  monthlyCreditsUsd: 200,
};

export const YC_PLAN_OFFER: PlanOffer = {
  planId: AUTUMN_YC_PLAN_ID,
  name: "YC Plan",
  priceUsd: 50,
  monthlyCreditsUsd: 50,
};

// Defined so plan attribution and reporting can resolve any Autumn plan id.
// What the subscribe page actually ADVERTISES is TIERS in subscribe-tiers.ts,
// which Maryland Insights restricts to Base (see REBUILD.md 1.1).
export const PRO_PLAN_OFFER: PlanOffer = {
  planId: AUTUMN_PRO_PLAN_ID,
  name: "Pro Plan",
  priceUsd: 30,
  monthlyCreditsUsd: 36,
};

export const AGENCY_PLAN_OFFER: PlanOffer = {
  planId: AUTUMN_AGENCY_PLAN_ID,
  name: "Agency Plan",
  priceUsd: 200,
  monthlyCreditsUsd: 240,
};

/** Every tier plan, for id -> offer lookups. Not the advertised set. */
export const TIER_PLAN_OFFERS = [
  BASE_PLAN_OFFER,
  PRO_PLAN_OFFER,
  AGENCY_PLAN_OFFER,
] as const;

export function monthlyCreditsFeature(offer: PlanOffer) {
  return `Includes $${offer.monthlyCreditsUsd.toFixed(2)} of Usage Credits each month`;
}
