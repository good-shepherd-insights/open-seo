import {
  BASE_PLAN_OFFER,
  type PlanOffer,
} from "@/client/features/billing/plan-offers";

// The tiers the subscribe page advertises. Maryland Insights offers the Base
// plan only; upstream's Pro and Agency SKUs carry upstream prices (see
// REBUILD.md 1.1). Its "Get started"
// links highlight one with ?plan=. Annual prices are the hidden yearly plans
// in Autumn, which support sets up by email until checkout can sell them.
export const TIERS = {
  base: {
    offer: BASE_PLAN_OFFER,
    // No approved Maryland Insights annual price; the yearly switch stays
    // hidden until one is set (see REBUILD.md 1.2).
    annualPriceUsd: null as number | null,
    description: "For your own website.",
    features: [
      "Keyword research, backlinks, rank tracking, and site audits",
      "AI visibility, prompt research, and tracking",
      "Works inside Claude, Cursor, and ChatGPT",
      "Free Google Search Console data",
    ],
  },
} satisfies Record<
  string,
  {
    offer: PlanOffer;
    annualPriceUsd: number | null;
    description: string;
    features: string[];
  }
>;
export type Tier = keyof typeof TIERS;

export function isTier(value: unknown): value is Tier {
  return typeof value === "string" && Object.hasOwn(TIERS, value);
}
