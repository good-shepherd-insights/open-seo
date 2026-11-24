import { useEffect } from "react";
import { useIsFetching, useIsMutating, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { billingAccountQueryOptions } from "@/client/features/billing/billingAccountQuery";
import { useCreditBalance } from "@/client/features/billing/useCreditBalance";
import { queryClient } from "@/client/tanstack-db";
import { BILLING_ROUTE } from "@/shared/billing";

// A charge can land just after the response that caused it.
const SETTLE_MS = 2_000;
const MIN_REFRESH_GAP_MS = 10_000;

/** Refreshes the balance once the app's other requests finish, since any of
 *  them may have spent credits, and each minute for background work. */
function useFreshBalance() {
  useQuery({ ...billingAccountQueryOptions(), refetchInterval: 60_000 });
  const fetching = useIsFetching({
    predicate: ({ queryKey }) => queryKey[0] !== "billing",
  });
  const busy = fetching + useIsMutating() > 0;
  useEffect(() => {
    if (busy) return;
    const { queryKey } = billingAccountQueryOptions();
    const updatedAt = queryClient.getQueryState(queryKey)?.dataUpdatedAt ?? 0;
    const timer = setTimeout(
      () => void queryClient.invalidateQueries({ queryKey }),
      Math.max(SETTLE_MS, updatedAt + MIN_REFRESH_GAP_MS - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [busy]);
}

export function NavBalance({
  isMobile,
  onNavigate,
}: {
  isMobile: boolean;
  onNavigate: () => void;
}) {
  useFreshBalance();
  const {
    accountQuery,
    totalRemaining,
    isUnlimited,
    isOutOfCredits,
    isLowCredits,
  } = useCreditBalance();
  if (!accountQuery.data) return null;

  const balance = isUnlimited
    ? "Unlimited"
    : `$${Math.max(0, totalRemaining).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
  return (
    <Link
      to={BILLING_ROUTE}
      aria-label={`${balance} credits left. Open billing`}
      onClick={onNavigate}
      className={cn(
        "inline-flex min-h-11 items-center text-[15px] whitespace-nowrap tabular-nums outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50",
        isOutOfCredits
          ? "text-red-700 dark:text-[#f29a9a]"
          : isLowCredits
            ? "text-amber-700 dark:text-[#f0c36a]"
            : "text-foreground",
      )}
    >
      {isMobile ? balance : `${balance} credits`}
    </Link>
  );
}
