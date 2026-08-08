"use client"

import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useDiagrams, diagramQueryKeys } from "@/hooks/useDiagrams"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { useHuemulFilters } from "@/hooks/useHuemulFilters"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { HuemulFilterButton } from "@/huemul/components/huemul-filter-button"
import { HuemulFilterChips } from "@/huemul/components/huemul-filter-chips"
import { HuemulFilterPanel } from "@/huemul/components/huemul-filter-panel"
import { HuemulFilterInline } from "@/huemul/components/huemul-filter-inline"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"
import { getAllExecutions } from "@/services/executions"
import type { FetchOptionsParams, FetchOptionsResult } from "@/huemul/components/huemul-field"
import type { HuemulFilterDef, HuemulFilterValue } from "@/types/huemul"

import {
  DiagramsPageHeader,
  DiagramsTable,
  DiagramsPageSkeleton,
  DiagramsPageEmptyState,
  DiagramsContentEmptyState,
  DiagramsPageDialogs,
  type DiagramsPageState,
} from "@/components/diagrams"
import type { Diagram } from "@/types/diagrams"

export default function DiagramsPage() {
  const [state, setState] = useState<DiagramsPageState>({
    editingDiagramId: null,
    deletingDiagram: null,
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { t } = useTranslation(['diagrams', 'common'])
  const { t: tFilters } = useTranslation('huemul-filters')
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const { canAccessDiagrams, isOrgAdmin, hasPermission, hasAnyPermission, isLoading: isLoadingPermissions } = useUserPermissions()
  const queryClient = useQueryClient()

  const canDelete = isOrgAdmin || hasPermission('diagram:d')
  const canView = isOrgAdmin || hasAnyPermission(['diagram:r', 'diagram:u'])

  const fetchExecutionOptions = useCallback(
    async ({ search: s, page: p, pageSize: ps }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getAllExecutions(selectedOrganizationId ?? '', {
        query: s || undefined,
        page: p,
        page_size: ps,
      })
      return {
        options: (res.data ?? []).map((execution) => ({
          value: execution.id,
          label: execution.name || execution.document_name,
        })),
        hasMore: res.has_next ?? false,
      }
    },
    [selectedOrganizationId],
  )

  const filterDefs = useMemo<HuemulFilterDef[]>(() => {
    return [
      {
        key: 'search',
        type: 'text',
        group: tFilters('groups.search'),
        toolbar: true,
        label: t('common:search', 'Search'),
        placeholder: t('header.searchPlaceholder'),
        inputClassName: 'w-56',
      },
      {
        key: 'executionId',
        type: 'async-combobox',
        group: tFilters('groups.classification'),
        label: t('filters.execution'),
        placeholder: t('filters.executionPlaceholder'),
        fetchOptions: fetchExecutionOptions,
        pageSize: 50,
        searchOnEnter: true,
      },
    ]
  }, [t, tFilters, fetchExecutionOptions])

  const {
    values,
    open: filtersOpen,
    setOpen: setFiltersOpen,
    setValue,
    clearValue,
    clearAll,
    chips,
    activeCount,
    setSelectedLabel,
  } = useHuemulFilters({ filters: filterDefs, defaultOpen: false })

  const handleFilterChange = useCallback((key: string, value: HuemulFilterValue) => {
    setValue(key, value)
    setPage(1)
  }, [setValue])

  const handleChipRemove = useCallback((key: string) => {
    clearValue(key)
    setPage(1)
  }, [clearValue])

  const handleClearAll = useCallback(() => {
    clearAll()
    setPage(1)
  }, [clearAll])

  const searchTerm = (values.search as string) || undefined
  const executionId = (values.executionId as string) || undefined

  const { data: diagramsResponse, isLoading, isFetching, error } = useDiagrams(
    selectedOrganizationId ?? '',
    {
      enabled: !!selectedOrganizationId && !!organizationToken && canAccessDiagrams,
      page,
      pageSize,
      search: searchTerm,
      executionId,
    }
  )

  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!diagramsResponse,
  })

  // Loading permissions
  if (isLoadingPermissions) return <DiagramsPageSkeleton />

  // Access check
  if (!canAccessDiagrams) return <DiagramsPageEmptyState type="access-denied" />

  // Organization check
  if (!selectedOrganizationId || !organizationToken) return <DiagramsPageEmptyState type="no-organization" />

  // Initial load
  if (showPageLoader) return <DiagramsPageSkeleton />

  const items = diagramsResponse?.data ?? []
  const hasActiveFilters = activeCount > 0 || !!searchTerm

  const updateState = (updates: Partial<DiagramsPageState>) =>
    setState((prev) => ({ ...prev, ...updates }))

  const closeDialog = (dialog: keyof DiagramsPageState) =>
    setState((prev) => ({ ...prev, [dialog]: null }))

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: diagramQueryKeys.listBase() })
    } finally {
      setIsRefreshing(false)
    }
  }

  const header = (
    <DiagramsPageHeader diagramCount={items.length} isLoading={isRefreshing || isFetching} onRefresh={handleRefresh}>
      <HuemulFilterButton
        count={activeCount}
        open={filtersOpen}
        onToggle={() => setFiltersOpen(!filtersOpen)}
      />
      <HuemulFilterInline
        filters={filterDefs}
        values={values}
        onChange={handleFilterChange}
        onSelectedLabel={setSelectedLabel}
      />
    </DiagramsPageHeader>
  )

  return (
    <>
      <HuemulPageLayout
        header={header}
        headerClassName="p-6 md:p-8 pb-0 md:pb-0"
        columns={[
          {
            content: (
              <HuemulFilterPanel
                filters={filterDefs}
                values={values}
                onChange={handleFilterChange}
                onSelectedLabel={setSelectedLabel}
                onClose={() => setFiltersOpen(false)}
              />
            ),
            show: filtersOpen,
            defaultSize: 22,
            minSize: 16,
            maxSize: 35,
            collapsible: true,
          },
          {
            content: (
              <div className="flex flex-col h-full gap-4">
                <HuemulFilterChips
                  chips={chips}
                  onRemove={handleChipRemove}
                  onClearAll={handleClearAll}
                />
                {error ? (
                  <DiagramsContentEmptyState
                    type="error"
                    message={(error as Error).message}
                    onRetry={handleRefresh}
                  />
                ) : items.length === 0 && !hasActiveFilters ? (
                  <DiagramsContentEmptyState type="empty" />
                ) : items.length === 0 && hasActiveFilters ? (
                  <DiagramsContentEmptyState type="no-results" onClearFilters={handleClearAll} />
                ) : (
                  <DiagramsTable
                    items={items}
                    onView={(diagram: Diagram) => updateState({ editingDiagramId: diagram.id })}
                    onDelete={(diagram: Diagram) => updateState({ deletingDiagram: diagram })}
                    canView={canView}
                    canDelete={canDelete}
                    isLoading={isTableLoading}
                    isFetching={isTableFetching}
                    pagination={{
                      page: diagramsResponse?.page ?? page,
                      pageSize: diagramsResponse?.page_size ?? pageSize,
                      hasNext: diagramsResponse?.has_next,
                      hasPrevious: (diagramsResponse?.page ?? page) > 1,
                      onPageChange: (newPage) => setPage(newPage),
                      onPageSizeChange: (newPageSize) => {
                        setPageSize(newPageSize)
                        setPage(1)
                      },
                      pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
                    }}
                  />
                )}
              </div>
            ),
            className: "p-6 md:p-8 pt-0 md:pt-0",
          },
        ]}
      />

      <DiagramsPageDialogs
        state={state}
        organizationId={selectedOrganizationId}
        onCloseDialog={closeDialog}
      />
    </>
  )
}
