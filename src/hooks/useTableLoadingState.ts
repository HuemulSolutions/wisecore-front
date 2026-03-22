import { useRef, useEffect } from "react"

interface TableLoadingStateOptions {
  /** isLoading from TanStack Query - true when no cached data exists */
  isLoading: boolean
  /** isFetching from TanStack Query - true on every in-flight request */
  isFetching: boolean
  /** Whether the query has returned data at least once */
  hasData: boolean
}

interface TableLoadingStateResult {
  /** Show full-page loader: only on the very first load (no data ever loaded) */
  showPageLoader: boolean
  /** Pass to DataTable isLoading: skeleton rows when there is no data to display */
  isTableLoading: boolean
  /** Pass to DataTable isFetching: subtle bar + dimmed rows when refetching with existing data */
  isTableFetching: boolean
}

/**
 * Standardizes how loading states are displayed for pages with a searchable DataTable.
 *
 * - Full-page loader only on the very first mount (before any data arrives).
 * - On subsequent fetches (search, pagination, refresh) the table shows a top bar
 *   and dims its existing rows rather than replacing the whole page.
 */
export function useTableLoadingState({
  isLoading,
  isFetching,
  hasData,
}: TableLoadingStateOptions): TableLoadingStateResult {
  const hasLoadedOnce = useRef(false)

  useEffect(() => {
    if (hasData) {
      hasLoadedOnce.current = true
    }
  }, [hasData])

  // Also mark synchronously so the first successful render is already reflected
  if (hasData) {
    hasLoadedOnce.current = true
  }

  const showPageLoader = isLoading && !hasLoadedOnce.current
  const isTableLoading = isLoading && hasLoadedOnce.current
  const isTableFetching = isFetching && !isLoading

  return { showPageLoader, isTableLoading, isTableFetching }
}
