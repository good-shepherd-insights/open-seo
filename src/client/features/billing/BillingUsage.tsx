import { useState } from "react";
import { cn } from "cn";
import { ChartColumn } from "lucide-react";
import type { BillingUsage as BillingUsageData } from "@/server/billing/usage";
import { EmptyState } from "@/client/components/EmptyState";
import { QueryState } from "@/client/components/QueryState";
import { Skeleton } from "@/client/components/ui/skeleton";
import { useBillingUsage } from "@/client/features/billing/useBillingUsage";

/** The billing Usage tab: the last 30 days by day, feature and project. */
export function BillingUsage() {
  const usageQuery = useBillingUsage();

  return (
    <QueryState
      query={usageQuery}
      errorFallback="Failed to load usage"
      loading={<UsageSkeleton />}
    >
      {(usage) => <UsageReport usage={usage} />}
    </QueryState>
  );
}

function UsageReport({ usage }: { usage: BillingUsageData }) {
  const totalUsd = usage.days.reduce((sum, day) => sum + day.usd, 0);

  // Every section would be empty, so one empty state stands for all three.
  if (totalUsd === 0) {
    return (
      <EmptyState
        variant="plain"
        icon={ChartColumn}
        title="No usage recorded yet"
        description="What you spend over the last 30 days shows up here, by day, feature and project."
      />
    );
  }

  return (
    <div className="space-y-8">
      <UsageChart days={usage.days} totalUsd={totalUsd} />

      <div className="grid gap-8 md:grid-cols-2">
        <Breakdown title="By feature" rows={usage.features} />
        <Breakdown title="By project" rows={usage.projects} />
      </div>
    </div>
  );
}

function UsageChart({
  days,
  totalUsd,
}: {
  days: BillingUsageData["days"];
  totalUsd: number;
}) {
  const last = days.length - 1;
  const [picked, setPicked] = useState(last);
  // A refresh can return fewer days than the one picked.
  const index = Math.min(picked, last);
  const day = days[index];
  const step = usageAxisStep(Math.max(...days.map((d) => d.usd)));
  const ticks = [0, 1, 2, 3, 4];
  const reading = `${formatShortDate(day.date)}, $${day.usd.toFixed(2)}`;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <div>
          <p className="text-sm text-muted-foreground">
            Spent in the last 30 days
          </p>
          <p className="text-3xl tracking-tight">${totalUsd.toFixed(2)}</p>
        </div>
        <p className="text-sm">
          <span className="text-muted-foreground">
            {formatShortDate(day.date)}
          </span>{" "}
          <span className="tabular-nums">${day.usd.toFixed(2)}</span>
        </p>
      </div>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 pt-2">
        <div className="relative h-50 text-xs text-muted-foreground">
          {/* The widest label holds the column open; the rest overlay it. */}
          <span className="invisible">{formatUsdAxis(step * 4)}</span>
          <span className="invisible block h-0">{formatUsdAxis(step)}</span>
          {ticks.map((n) => (
            <span
              key={n}
              className="absolute left-0 translate-y-1/2"
              style={{ bottom: `${n * 25}%` }}
            >
              {formatUsdAxis(step * n)}
            </span>
          ))}
        </div>
        <div className="relative h-50 rounded-sm has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50">
          {ticks.map((n) => (
            <span
              key={n}
              aria-hidden
              className="absolute inset-x-0 border-t border-border"
              style={{ bottom: `${n * 25}%` }}
            />
          ))}
          <div aria-hidden className="absolute inset-0 flex items-end gap-0.5">
            {days.map((d, n) => (
              <div
                key={d.date}
                className={cn(
                  "min-w-0 flex-1 rounded-t-xs",
                  n === index ? "bg-primary" : "bg-muted-foreground/60",
                )}
                style={{ height: `${Math.max(0, d.usd / (step * 4)) * 100}%` }}
              />
            ))}
          </div>
          {/* One control over the whole chart: a single day is too narrow to
              tap on a phone. */}
          <input
            type="range"
            min={0}
            max={last}
            value={index}
            aria-label="Day"
            aria-valuetext={reading}
            className="absolute inset-0 m-0 size-full cursor-pointer touch-pan-y opacity-0"
            onChange={(event) => setPicked(Number(event.target.value))}
            onMouseMove={(event) => {
              const box = event.currentTarget.getBoundingClientRect();
              const at = ((event.clientX - box.left) / box.width) * days.length;
              setPicked(Math.min(last, Math.max(0, Math.floor(at))));
            }}
          />
        </div>
        <div className="col-start-2 flex justify-between pt-1.5 text-xs text-muted-foreground">
          {[0, Math.floor(last / 2), last].map((n, at) => (
            <span key={at}>{formatShortDate(days[n].date)}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The dollars between the chart's five lines: a round step whose fourth
 *  line is at or above the biggest day. */
function usageAxisStep(maxUsd: number) {
  const raw = Math.max(maxUsd, 0.04) / 4;
  const unit = 10 ** Math.floor(Math.log10(raw));
  const round = [1, 2, 5, 10].find((n) => n * unit >= raw * 0.999999) ?? 10;
  return round * unit;
}

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: BillingUsageData["features"];
}) {
  const total = rows.reduce((sum, row) => sum + row.usd, 0);

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li
            key={row.label}
            className="space-y-2 border-t border-border pt-2.5"
          >
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="min-w-0 truncate">{row.label}</span>
              <span className="ml-auto tabular-nums">
                ${row.usd.toFixed(2)}
              </span>
              <span className="w-10 text-right text-muted-foreground tabular-nums">
                {Math.round((row.usd / total) * 100)}%
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(row.usd / total) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function UsageSkeleton() {
  return (
    <div aria-busy className="space-y-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-20" />
        </div>
        <Skeleton className="h-50 w-full" />
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        {[0, 1].map((column) => (
          <div key={column} className="space-y-3">
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatShortDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatUsdAxis(value: number) {
  return `$${value % 1 === 0 ? value : value.toFixed(2)}`;
}
