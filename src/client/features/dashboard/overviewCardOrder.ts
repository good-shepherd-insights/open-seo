import type { OverviewCardId } from "@/types/schemas/dashboard";

/** Preserve the dashboard's existing data-first order until a preference exists. */
export function orderOverviewCards<
  T extends { key: OverviewCardId; hasData: boolean },
>(cards: readonly T[], savedOrder: readonly OverviewCardId[] | null): T[] {
  const defaults = [...cards].sort(
    (a, b) => Number(b.hasData) - Number(a.hasData),
  );
  if (!savedOrder) return defaults;
  const rank = new Map(savedOrder.map((key, index) => [key, index]));
  return defaults.sort(
    (a, b) =>
      (rank.get(a.key) ?? Number.MAX_SAFE_INTEGER) -
      (rank.get(b.key) ?? Number.MAX_SAFE_INTEGER),
  );
}

/** Move visible cards through the saved order without losing hidden cards. */
export function mergeOverviewCardOrder(
  current: readonly OverviewCardId[],
  visible: readonly OverviewCardId[],
): OverviewCardId[] {
  const moved = new Set(visible);
  const next = [...visible];
  return current.map((key) => (moved.has(key) ? next.shift()! : key));
}
