import {
  BASE_PLAN_OFFER,
  GROWTH_PLAN_OFFER,
  ULTIMATE_PLAN_OFFER,
  type PlanOffer,
} from "@/client/features/billing/plan-offers";
import type { CheckoutPlanId } from "@/shared/billing";

type AnnualPlan = { planId: CheckoutPlanId; priceUsd: number };

// The tiers the subscribe page advertises; "Get started" links highlight one
// with ?plan=. No annual price is set, so the yearly switch stays hidden.
export const TIERS = {
  base: {
    offer: BASE_PLAN_OFFER,
    annual: null as AnnualPlan | null,
    description: "For your own website.",
  },
  growth: {
    offer: GROWTH_PLAN_OFFER,
    annual: null as AnnualPlan | null,
    description: "For 5–10 websites.",
  },
  ultimate: {
    offer: ULTIMATE_PLAN_OFFER,
    annual: null as AnnualPlan | null,
    description: "For 10+ websites.",
  },
} satisfies Record<
  string,
  { offer: PlanOffer; annual: AnnualPlan | null; description: string }
>;

/** What every tier includes. */
export const PLAN_FEATURES = [
  "Keyword research, backlinks, rank tracking, and site audits",
  "AI visibility, prompt research, and tracking",
  "Works inside Claude, Cursor, and ChatGPT",
  "Free Google Search Console data",
];
export type Tier = keyof typeof TIERS;

export function isTier(value: unknown): value is Tier {
  return typeof value === "string" && Object.hasOwn(TIERS, value);
}
