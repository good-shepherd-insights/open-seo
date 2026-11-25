import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BacklinksIllustration } from "@/client/components/EmptyIllustrations";
import { BackLink } from "@/client/components/PageHeader";
import { QueryError } from "@/client/components/QueryState";
import { RecentSearches } from "@/client/components/RecentSearches";
import { BacklinksResultsCard } from "@/client/features/backlinks/BacklinksPageSections";
import { BacklinksLoadingState } from "@/client/features/backlinks/BacklinksPageStates";
import { BacklinksSearchCard } from "@/client/features/backlinks/BacklinksSearchCard";
import type { BacklinksPageProps } from "@/client/features/backlinks/backlinksPageTypes";
import { SuggestedSites } from "@/client/features/projects/SuggestedSites";
import { SearchTabStrip } from "@/client/features/search-tabs/SearchTabStrip";
import {
  RESEARCH_SCOPE_LABELS,
  toScopeSearchParam,
} from "@/shared/researchScope";
import { BacklinksView } from "./BacklinksView";
import { useBacklinksScreen } from "./useBacklinksScreen";

type Screen = ReturnType<typeof useBacklinksScreen>;

const CLEARED_SEARCH = {
  target: undefined,
  scope: undefined,
  tab: undefined,
  page: undefined,
  size: undefined,
  sort: undefined,
  order: undefined,
};

/** Wires the data to the view. Same props as upstream's BacklinksPage. */
export function BacklinksScreen(props: BacklinksPageProps) {
  const { projectId, searchState } = props;
  const screen = useBacklinksScreen(props);
  const { searchTabs } = screen;
  const searched = Boolean(searchState.target);
  return (
    <BacklinksView
      backLink={
        searched ? (
          <BackLink
            to="/p/$projectId/backlinks"
            params={{ projectId }}
            search={CLEARED_SEARCH}
            replace
          >
            Recent searches
          </BackLink>
        ) : undefined
      }
      search={
        <BacklinksSearchCard
          initialValues={screen.data.searchCardInitialValues}
          onSubmit={screen.runSearch}
        />
      }
      searchTabs={
        searched ? (
          <SearchTabStrip
            projectId={projectId}
            activeTabId={searchTabs.activeTabId}
            tabs={searchTabs.tabs}
            onSelect={searchTabs.selectTab}
            onClose={searchTabs.closeTab}
            onViewed={searchTabs.markTabViewed}
          />
        ) : undefined
      }
      placeholder={renderPlaceholder(projectId, searched, screen)}
      overview={screen.overview}
      stats={screen.stats}
      links={renderLinks(props, screen)}
    />
  );
}

function renderPlaceholder(
  projectId: string,
  searched: boolean,
  { data, overview, history, onSearchSite }: Screen,
): ReactNode {
  if (!searched) {
    return (
      <RecentSearches
        items={history.history}
        loaded={history.isLoaded}
        onRemove={history.removeHistoryItem}
        emptyIllustration={<BacklinksIllustration />}
        emptyTitle="Find sites that could link to you"
        emptyDescription="Look up a competitor to see who links to them, or your own site to see links you gained and lost."
        emptyAction={
          <SuggestedSites
            projectId={projectId}
            renderLink={(domain, linkProps) => (
              <button
                type="button"
                onClick={() => onSearchSite(domain)}
                {...linkProps}
              />
            )}
          />
        }
        getTitle={(item) => item.target}
        getSubtitle={(item) => RESEARCH_SCOPE_LABELS[item.scope]}
        renderLink={(item, linkProps) => (
          <Link
            from="/p/$projectId/backlinks"
            to="/p/$projectId/backlinks"
            params={{ projectId }}
            search={(prev) => ({
              ...prev,
              target: item.target,
              scope: toScopeSearchParam(item.target, item.scope),
              tab: undefined,
              page: undefined,
              sort: undefined,
              order: undefined,
            })}
            replace
            {...linkProps}
          />
        )}
      />
    );
  }
  // isPending also covers a fetch paused while offline.
  if (data.overviewQuery.isPending) return <BacklinksLoadingState />;
  if (!overview) {
    return (
      <QueryError
        title="Could not load backlinks"
        cause={data.overviewQuery.error}
        fallback={data.overviewErrorMessage ?? "Please try again in a moment."}
        onRetry={() => void data.overviewQuery.refetch()}
        isRetrying={data.overviewQuery.isFetching}
      />
    );
  }
  return undefined;
}

function renderLinks(
  { projectId, searchState }: BacklinksPageProps,
  screen: Screen,
): ReactNode {
  const { data, overview } = screen;
  if (!overview) return undefined;
  const page = data.activeTabQuery.data;
  const filterError = data.activeTabFilterError;
  return (
    <BacklinksResultsCard
      projectId={projectId}
      activeTab={searchState.tab}
      scope={searchState.scope}
      tabRows={screen.tabRows}
      filters={screen.filters}
      sorting={screen.sorting}
      view={searchState.view}
      hideSpam={!searchState.includeSpam}
      onHideSpamChange={screen.onHideSpamChange}
      domainExpansion={screen.domainExpansion}
      isTabLoading={data.activeTabQuery.isPending && !filterError}
      isTabRefreshing={data.activeTabQuery.isPlaceholderData}
      // A failed refetch keeps the loaded rows; a filter budget error hides
      // them because the query never ran for the current filters.
      showTable={page !== undefined && !filterError}
      tabErrorMessage={data.activeTabErrorMessage}
      tabError={filterError ? undefined : data.activeTabQuery.error}
      onRetryTab={
        filterError ? undefined : () => void data.activeTabQuery.refetch()
      }
      isTabRetrying={data.activeTabQuery.isFetching}
      exportTarget={overview.displayTarget || searchState.target}
      pagination={{
        page: searchState.page,
        pageSize: searchState.pageSize,
        totalCount: page?.totalCount ?? null,
        hasNextPage: page?.hasMore ?? false,
        isFetching: data.activeTabQuery.isFetching,
      }}
      onPageChange={screen.onPageChange}
      onPageSizeChange={screen.onPageSizeChange}
      onSortingChange={screen.onSortingChange}
      onTabChange={screen.onTabChange}
      onViewChange={screen.onViewChange}
    />
  );
}
