import { useState } from "react";
import {
  formatCompactDate,
  formatMonthLabel,
  formatNumber,
} from "@/client/features/backlinks/backlinksPageUtils";

const compact = new Intl.NumberFormat(undefined, { notation: "compact" });

/** One small bar chart per series, so each keeps its own scale. */
export function TrendBars<K extends string>({
  label,
  rows,
  series,
}: {
  label: string;
  rows: Array<{ date: string } & Record<K, number | null | undefined>>;
  series: Array<{ key: K; name: string }>;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-muted-foreground">
        Not enough historical data yet.
      </p>
    );
  }
  const current = Math.min(picked ?? rows.length - 1, rows.length - 1);
  const ticks = [0, Math.floor((rows.length - 1) / 2), rows.length - 1].filter(
    (value, index, all) => all.indexOf(value) === index,
  );
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-4">
      {series.map(({ key, name }) => {
        const top = Math.max(...rows.map((row) => row[key] ?? 0));
        return (
          <div key={key}>
            <div className="flex flex-wrap justify-between gap-x-2 text-[13px] text-muted-foreground">
              <span>{name}</span>
              <span aria-live="polite">
                {formatCompactDate(rows[current].date)}:{" "}
                <span className="text-foreground tabular-nums">
                  {formatNumber(rows[current][key])}
                </span>
              </span>
            </div>
            <div className="mt-1.5 flex gap-2">
              <div
                aria-hidden
                className="flex h-21 w-10 flex-col justify-between text-right text-[13px] leading-none text-muted-foreground"
              >
                <span>{compact.format(top)}</span>
                <span>0</span>
              </div>
              <div className="flex h-19 min-w-0 flex-1 items-end border-b border-input">
                {rows.map((row, index) => (
                  <button
                    key={row.date}
                    type="button"
                    aria-label={`${name}, ${formatCompactDate(row.date)}: ${formatNumber(row[key])}`}
                    aria-pressed={index === current}
                    onClick={() => setPicked(index)}
                    onMouseEnter={() => setPicked(index)}
                    onFocus={() => setPicked(index)}
                    className="flex h-full min-w-0 flex-1 cursor-pointer items-end px-px outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      className="w-full rounded-t-xs"
                      style={{
                        height: `${top > 0 ? ((row[key] ?? 0) / top) * 100 : 0}%`,
                        backgroundColor:
                          index === current
                            ? "var(--primary)"
                            : "var(--trend-bar)",
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
      <div
        aria-hidden
        className="ml-12 flex justify-between text-[13px] text-muted-foreground"
      >
        {ticks.map((index) => (
          <span key={index}>{formatMonthLabel(rows[index].date)}</span>
        ))}
      </div>
    </div>
  );
}
