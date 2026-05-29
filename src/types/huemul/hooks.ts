export interface TableLoadingStateOptions {
  /** isLoading from TanStack Query - true when no cached data exists */
  isLoading: boolean
  /** isFetching from TanStack Query - true on every in-flight request */
  isFetching: boolean
  /** Whether the query has returned data at least once */
  hasData: boolean
}

export interface TableLoadingStateResult {
  /** Show full-page loader: only on the very first load (no data ever loaded) */
  showPageLoader: boolean
  /** Pass to DataTable isLoading: skeleton rows when there is no data to display */
  isTableLoading: boolean
  /** Pass to DataTable isFetching: subtle bar + dimmed rows when refetching with existing data */
  isTableFetching: boolean
}

export interface UseScrollPreservationReturn {
  scrollContainerRef: import('react').RefObject<HTMLDivElement | null>
  saveScrollPosition: () => void
  restoreScrollPosition: () => void
  preserveScroll: () => void
}
