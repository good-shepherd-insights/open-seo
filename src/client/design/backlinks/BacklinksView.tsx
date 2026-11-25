import type { ReactNode } from "react";
import { PageHeader } from "@/client/components/PageHeader";
import { Badge } from "@/client/components/ui/badge";
import { Card } from "@/client/components/ui/card";
import { BacklinksScopeAlert } from "@/client/features/backlinks/BacklinksOverviewPanels";
import type { BacklinksOverviewData } from "@/client/features/backlinks/backlinksPageTypes";
import { formatRelativeTimestamp } from "@/client/features/backlinks/backlinksPageUtils";
import { RESEARCH_SCOPE_LABELS } from "@/shared/researchScope";
import { TrendBars } from "./TrendBars";

type SummaryStat = { label: string; value: string; description: string };

type BacklinksViewProps = {
  backLink?: ReactNode;
  search: ReactNode;
  /** Open searches, shown once there is a target. */
  searchTabs?: ReactNode;
  /** Stands in for the results: recent searches, loading or an error. */
  placeholder?: ReactNode;
  overview?: BacklinksOverviewData;
  stats: SummaryStat[];
  /** The tabs, toolbar and table. */
  links?: ReactNode;
};

/** Layout only: everything arrives as props, nothing is fetched here. */
export function BacklinksView({
  backLink,
  search,
  searchTabs,
  placeholder,
  overview,
  stats,
  links,
}: BacklinksViewProps) {
  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 pt-8 pb-18">
      <PageHeader
        title="Backlinks"
        description="Understand who links to a site, what changed recently, and which pages attract links."
        backLink={backLink}
      />
      {search}
      {searchTabs}
      {placeholder}
      {overview && !placeholder ? (
        <>
          <BacklinksScopeAlert scope={overview.scope} />
          <Overview data={overview} stats={stats} />
          <Card role="region" aria-label="Links" className="gap-0 px-4 py-2">
            {links}
          </Card>
        </>
      ) : null}
    </div>
  );
}

function Overview({
  data,
  stats,
}: {
  data: BacklinksOverviewData;
  stats: SummaryStat[];
}) {
  // The trend source only covers whole hostnames.
  const hasTrends = data.scope === "domain" || data.scope === "subdomains";
  return (
    <Card
      role="region"
      aria-label="Overview"
      className="gap-4 px-5 pt-4 pb-5 text-[15px]"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-lg font-medium break-all">{data.displayTarget}</h2>
        <Badge variant="outline">{RESEARCH_SCOPE_LABELS[data.scope]}</Badge>
        <p className="text-sm text-muted-foreground sm:ml-auto">
          Updated {formatRelativeTimestamp(data.fetchedAt)}
        </p>
      </div>
      <div
        className={
          hasTrends
            ? "grid gap-7 md:grid-cols-2 xl:grid-cols-3"
            : "grid max-w-xl"
        }
      >
        <table className="w-full self-start">
          <thead className="text-[13px] text-muted-foreground">
            <tr>
              <th className="pb-2 text-left font-normal">Metric</th>
              <th className="pb-2 pl-4 text-right font-normal">Value</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat) => (
              <tr key={stat.label} className="border-t border-border">
                <td className="py-2.5">
                  {stat.label}
                  <div className="text-[13px] text-muted-foreground">
                    {stat.description}
                  </div>
                </td>
                <td className="py-2.5 pl-4 text-right text-lg tabular-nums">
                  {stat.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {hasTrends ? (
          <>
            <TrendSection
              title="Backlink growth"
              note={
                data.scope === "domain"
                  ? "Last year · Includes subdomains"
                  : "Backlinks and referring domains over the last year"
              }
            >
              <TrendBars
                label="Backlink trend chart"
                rows={data.trends}
                series={[
                  { key: "backlinks", name: "Backlinks" },
                  { key: "referringDomains", name: "Referring domains" },
                ]}
              />
            </TrendSection>
            <TrendSection
              title="New vs lost"
              note="Backlink acquisition and attrition"
            >
              <TrendBars
                label="New and lost backlinks chart"
                rows={data.newLostTrends}
                series={[
                  { key: "newBacklinks", name: "New backlinks" },
                  { key: "lostBacklinks", name: "Lost backlinks" },
                ]}
              />
            </TrendSection>
          </>
        ) : null}
      </div>
    </Card>
  );
}

function TrendSection({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <h3 className="text-base font-medium">{title}</h3>
      <p className="mb-3 text-sm text-muted-foreground">{note}</p>
      {children}
    </div>
  );
}
