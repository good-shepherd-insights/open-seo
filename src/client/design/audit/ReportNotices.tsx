import { Fragment, type ReactNode } from "react";
import { Button } from "@/client/components/ui/button";
import { ShopifyCrawlWarning } from "@/client/features/audit/results/ShopifyCrawlWarning";
import { ShopifyRateLimitAlert } from "@/client/features/audit/results/ShopifyRateLimitAlert";
import type { AuditResultsData } from "@/client/features/audit/results/types";
import { BotProtectionAdvice } from "@/client/features/audit/shared";
import { AuditStatus } from "@/shared/audit-status";
import { SUPPORT_EMAIL } from "@/client/lib/support";
import { parseDetails, plural, type ReportOverview } from "./auditReportFormat";

/** What the reader must know about this crawl before reading its results. */
export function ReportNotices({
  projectId,
  data,
  overview,
  onShowUnread,
  onShowFix,
}: {
  projectId: string;
  data: AuditResultsData;
  overview: ReportOverview;
  onShowUnread: () => void;
  onShowFix: (issueType: string) => void;
}) {
  const { audit, fetchClassCounts, issueGroups } = data;
  const {
    blocked,
    rate_limited: rateLimited,
    error: unread,
  } = fetchClassCounts;
  const rendered = audit.config.renderJavaScript === true;
  const excludePaths = audit.config.excludePaths ?? [];
  // Shopify stores get their own notices: one for pages it rate limited, and
  // the signature setup for a crawl it only blocked.
  const isShopify = audit.config.sitePlatform === "shopify";
  const shopifyRateLimited = isShopify && rateLimited > 0;
  const shopifyBlocked = isShopify && !shopifyRateLimited && blocked > 0;
  const shopifyNotice = shopifyRateLimited || shopifyBlocked;
  const stop = overview.crawlStop;
  const hasShells = issueGroups.some(
    (group) => group.issueType === "javascript-rendering-suspected",
  );
  const seePages = (
    <Button variant="outline" onClick={onShowUnread}>
      See these pages
    </Button>
  );

  return (
    <>
      {audit.status === AuditStatus.Failed ? (
        <Notice
          title={`This audit stopped early after ${plural(data.pageCount, "page")}.`}
        >
          The results below cover everything crawled before it stopped. Run a
          new audit to try again, or email{" "}
          <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>{" "}
          if this keeps happening.
        </Notice>
      ) : null}

      {stop ? <CrawlStopNotice stop={stop} /> : null}

      {excludePaths.length > 0 ? (
        <Notice
          title={
            <>
              This audit skipped pages matching{" "}
              {excludePaths.map((path, index) => (
                <Fragment key={path}>
                  {index > 0 && ", "}
                  <code>{path}</code>
                </Fragment>
              ))}
            </>
          }
        >
          The orphan page check didn’t run, because links from skipped pages
          aren’t known.
        </Notice>
      ) : null}

      {shopifyNotice ? (
        <div className="[&>[data-slot=alert]]:rounded-xl [&>[data-slot=alert]]:border-0 [&>[data-slot=alert]]:border-l-3 [&>[data-slot=alert]]:border-primary [&>[data-slot=alert]]:bg-card [&>[data-slot=alert]]:p-4 [&>[data-slot=alert]]:text-[15px] [&>[data-slot=alert]]:text-foreground">
          {shopifyRateLimited ? (
            <ShopifyRateLimitAlert
              projectId={projectId}
              audit={audit}
              rateLimitedCount={rateLimited}
            />
          ) : (
            <ShopifyCrawlWarning projectId={projectId} audit={audit} />
          )}
        </div>
      ) : null}

      {!shopifyNotice && blocked > 0 ? (
        <Notice
          title={
            audit.status === AuditStatus.Refused && rateLimited === 0
              ? "This site’s bot protection blocked our crawler."
              : `Bot protection blocked our crawler on ${plural(blocked, "page")}.`
          }
          action={seePages}
        >
          <BotProtectionAdvice projectId={projectId} rendered={rendered} />
        </Notice>
      ) : null}

      {!shopifyNotice &&
      rateLimited > 0 &&
      stop?.issueType !== "crawl-rate-limited" ? (
        <Notice
          title={`The site rate limited us on ${plural(rateLimited, "page")}.`}
          action={seePages}
        >
          Run it again after the limit resets, or ask the site owner to allow
          our crawler.
        </Notice>
      ) : null}

      {hasShells ? (
        <Notice
          title="Some pages may need JavaScript to show their content."
          action={
            <Button
              variant="outline"
              onClick={() => onShowFix("javascript-rendering-suspected")}
            >
              See these pages
            </Button>
          }
        >
          {rendered
            ? "They were still loading after rendering, so we couldn’t check them."
            : "Turn on Render JavaScript and run the audit again to check them."}
        </Notice>
      ) : null}

      {unread > 0 ? (
        <Notice
          title={`We couldn’t read ${plural(unread, "page")}.`}
          action={seePages}
        >
          {rendered ? "JavaScript rendering was enabled for this audit." : null}
        </Notice>
      ) : null}
    </>
  );
}

function CrawlStopNotice({
  stop,
}: {
  stop: NonNullable<ReportOverview["crawlStop"]>;
}) {
  if (stop.issueType === "crawl-rate-limited") {
    return (
      <Notice title="The crawl stopped early because of the site’s rate limit.">
        The site kept refusing pages, so some URLs were left unvisited. This
        report is incomplete. Run it again after the limit resets, or ask the
        site owner to allow our crawler.
      </Notice>
    );
  }
  const details = parseDetails(stop.detailsJson);
  return (
    <Notice title="This report covers part of your site">
      {stop.issueType === "crawl-time-limit"
        ? "The audit reached its time limit before reading every page."
        : stop.issueType === "crawl-credits-exhausted"
          ? "The audit reached its cost limit before reading every page."
          : details?.pagesCrawled != null && details.urlsNotCrawled != null
            ? `It stopped at the ${details.pagesCrawled}-page limit with ${plural(details.urlsNotCrawled, "more page")} found. Run it again with a higher limit to cover them.`
            : "It stopped at the page limit. Run it again with a higher limit to cover the rest."}
    </Notice>
  );
}

function Notice({
  title,
  action,
  children,
}: {
  title: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-5 gap-y-2.5 rounded-xl border-l-3 border-primary bg-card px-4.5 py-3.5 text-[15px]"
    >
      <div className="min-w-0 flex-1 basis-96">
        <p className="font-medium">{title}</p>
        {children ? (
          <p className="mt-0.5 text-muted-foreground">{children}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
