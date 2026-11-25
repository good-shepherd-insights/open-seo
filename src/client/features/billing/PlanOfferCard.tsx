import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "cn";
import {
  monthlyCreditsFeature,
  type PlanOffer,
} from "@/client/features/billing/plan-offers";
import { Card, CardContent } from "@/client/components/ui/card";
import { PLAN_FEATURES } from "@/client/features/billing/subscribe-tiers";
import { SUPPORT_EMAIL } from "@/client/lib/support";

// Shared card for the full-page checkout screens (/subscribe). Callers
// pass the CTA and any extra notes as children.
export function PlanOfferCard({
  offer,
  description,
  priceUsd = offer.priceUsd,
  period = "month",
  highlighted = false,
  children,
}: {
  offer: PlanOffer;
  description?: string;
  priceUsd?: number;
  period?: "month" | "year";
  highlighted?: boolean;
  children: ReactNode;
}) {
  return (
    <Card size="lg" className={cn(highlighted && "border-primary!")}>
      <CardContent className="flex flex-1 flex-col gap-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-medium">{offer.name}</h2>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {/* The credits are what sets the plans apart, so they sit with
              the price instead of at the end of the list. */}
          <div className="space-y-1">
            <p className="flex items-baseline gap-1">
              <span className="text-4xl tracking-tight">
                ${priceUsd.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">/{period}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {monthlyCreditsFeature(offer)}
            </p>
          </div>
        </div>

        <div className="mt-auto">{children}</div>
      </CardContent>
    </Card>
  );
}

/** What every plan shares, under the cards. */
export function PlanDetails() {
  return (
    <div className="grid gap-x-14 gap-y-7 border-t border-border pt-7 md:grid-cols-2">
      <section className="space-y-3.5">
        <h2 className="text-lg font-medium">Every plan includes</h2>
        <ul className="space-y-3">
          {PLAN_FEATURES.map((item) => (
            <li key={item} className="flex gap-2.5">
              <Check
                aria-hidden
                className="mt-1 size-4 shrink-0 text-primary"
              />
              {item}
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-medium">30-day money-back guarantee</h2>
        <p>
          Not for you? Email us within 30 days of your charge and we&rsquo;ll
          refund your subscription. Cancel anytime. Powered by Stripe.
        </p>
        <p className="text-muted-foreground">
          Questions? Email{" "}
          <a
            className="underline underline-offset-2 transition-colors hover:text-foreground"
            href={`mailto:${SUPPORT_EMAIL}`}
          >
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </section>
    </div>
  );
}
