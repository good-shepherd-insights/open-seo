import { useCallback, useMemo } from "react";
import type { SortingState, Updater } from "@tanstack/react-table";
import type { BacklinksPageProps } from "@/client/features/backlinks/backlinksPageTypes";
import { buildSummaryStats } from "@/client/features/backlinks/backlinksPageUtils";
import { useBacklinksDomainExpansion } from "@/client/features/backlinks/useBacklinksDomainExpansion";
import { useBacklinksFilters } from "@/client/features/backlinks/useBacklinksFilters";
import {
  navigateToBacklinksSearch,
  useBacklinksPageData,
} from "@/client/features/backlinks/useBacklinksPageData";
import type { SearchTabInput } from "@/client/features/search-tabs/types";
import { useSearchTabNavigation } from "@/client/features/search-tabs/useSearchTabNavigation";
import { useBacklinksSearchHistory } from "@/client/hooks/useBacklinksSearchHistory";
import {
  defaultScopeForInput,
  type ResearchScope,
} from "@/shared/researchScope";
import {
  BACKLINKS_DEFAULT_SORT,
  DEFAULT_BACKLINKS_PAGE_SIZE,
} from "@/types/schemas/backlinks";

/** Upstream's BacklinksPage state and actions, without its layout. */
export function useBacklinksScreen({
  projectId,
  searchState,
  navigate,
}: BacklinksPageProps) {
  const filters = useBacklinksFilters();
  // Sort lives in the URL so it changes in one navigation with the page reset.
  const sorting = useMemo<SortingState>(() => {
    const fallback = BACKLINKS_DEFAULT_SORT[searchState.tab];
    const field = searchState.sort ?? fallback.field;
    const order =
      searchState.order ?? (searchState.sort ? "desc" : fallback.order);
    return [{ id: field, desc: order === "desc" }];
  }, [searchState.order, searchState.sort, searchState.tab]);
  const updateSearch = useCallback(
    (updates: Record<string, unknown>) => {
      navigate({ search: (prev) => ({ ...prev, ...updates }), replace: true });
    },
    [navigate],
  );
  const onSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];
      updateSearch({
        sort: first?.id,
        order: first ? (first.desc ? "desc" : "asc") : undefined,
        page: undefined,
      });
    },
    [sorting, updateSearch],
  );

  const data = useBacklinksPageData({ projectId, searchState, filters });
  const domainExpansion = useBacklinksDomainExpansion({
    projectId,
    searchState,
    rows: data.activeTabErrorMessage ? [] : (data.rowsQuery.data?.rows ?? []),
  });
  const history = useBacklinksSearchHistory(projectId);

  const urlInput = useMemo<SearchTabInput | null>(
    () =>
      searchState.target.trim() === ""
        ? null
        : {
            type: "backlinks",
            target: searchState.target,
            scope: searchState.scope,
          },
    [searchState.scope, searchState.target],
  );
  const navigateToInput = useCallback(
    (input: SearchTabInput | null) => {
      if (input?.type !== "backlinks") {
        navigate({ search: () => ({}), replace: true });
        return;
      }
      navigateToBacklinksSearch(navigate, {
        target: input.target,
        scope: input.scope,
      });
    },
    [navigate],
  );
  const searchTabs = useSearchTabNavigation({
    storageKey: `backlinks:${projectId}`,
    urlInput,
    getLabel: useCallback(
      (input) => (input.type === "backlinks" ? input.target : ""),
      [],
    ),
    navigateToInput,
  });

  const runSearch = (values: { target: string; scope: ResearchScope }) => {
    searchTabs.openTab({ type: "backlinks", ...values });
    navigateToBacklinksSearch(navigate, values);
    history.addSearch(values);
  };

  const overview = data.overviewQuery.data;
  const stats = useMemo(() => buildSummaryStats(overview), [overview]);
  const tabRows = useMemo(
    () => ({
      backlinks: data.rowsQuery.data?.rows ?? [],
      referringDomains: data.referringDomainsQuery.data?.rows ?? [],
      topPages: data.topPagesQuery.data?.rows ?? [],
    }),
    [
      data.rowsQuery.data,
      data.referringDomainsQuery.data,
      data.topPagesQuery.data,
    ],
  );

  return {
    data,
    overview,
    stats,
    tabRows,
    filters,
    sorting,
    domainExpansion,
    history,
    searchTabs,
    runSearch,
    onSortingChange,
    onSearchSite: (target: string) =>
      runSearch({ target, scope: defaultScopeForInput(target) }),
    onPageChange: (page: number) =>
      updateSearch({ page: page === 1 ? undefined : page }),
    onPageSizeChange: (size: number) =>
      updateSearch({
        size: size === DEFAULT_BACKLINKS_PAGE_SIZE ? undefined : size,
        page: undefined,
      }),
    onTabChange: (tab: typeof searchState.tab) =>
      updateSearch({
        tab: tab === "backlinks" ? undefined : tab,
        page: undefined,
        sort: undefined,
        order: undefined,
      }),
    onViewChange: (view: "all" | undefined) =>
      updateSearch({ view, page: undefined }),
    onHideSpamChange: (hideSpam: boolean) =>
      updateSearch({
        includeSpam: hideSpam ? undefined : true,
        page: undefined,
      }),
  };
}
