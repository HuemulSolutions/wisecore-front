import { useRef, useEffect } from "react"
import type { TableLoadingStateOptions, TableLoadingStateResult } from "@/types/huemul"

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
