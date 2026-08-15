"use client"

import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { Plus, RefreshCw, Workflow } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulFilterChips } from "@/huemul/components/huemul-filter-chips"
import { HuemulFilterInline } from "@/huemul/components/huemul-filter-inline"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"
import { useHuemulFilters } from "@/hooks/useHuemulFilters"
import { useDiagrams, diagramQueryKeys } from "@/hooks/useDiagrams"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { getAllExecutions } from "@/services/executions"
import type { FetchOptionsParams, FetchOptionsResult } from "@/huemul/components/huemul-field"
import type { HuemulFilterDef, HuemulFilterValue } from "@/types/huemul"
import type { Diagram } from "@/types/diagrams"
import { DiagramsTable } from "./diagrams-table"
import { DiagramsContentEmptyState } from "./diagrams-content-empty-state"
import { DiagramsDeleteDialog } from "./diagrams-delete-dialog"

export interface DiagramsListSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  /** Abre el diagrama en el canvas de la página. */
  onSelect: (diagram: Diagram) => void
  /** Abre un canvas en blanco. Omitir para ocultar el botón. */
  onCreate?: () => void
  canList: boolean
  canView: boolean
  canDelete: boolean
  canListExecutions: boolean
}

/**
 * Listado de diagramas de la organización. Vive en un sheet porque en /diagrams
 * la superficie principal es el canvas: la lista es el selector desde el que se
 * elige qué editar, no el contenido de la página.
 */
export function DiagramsListSheet({
  open,
  onOpenChange,
  organizationId,
  onSelect,
  onCreate,
  canList,
  canView,
  canDelete,
  canListExecutions,
}: DiagramsListSheetProps) {
  const { t } = useTranslation(['diagrams', 'common'])
  const { t: tFilters } = useTranslation('huemul-filters')
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [deletingDiagram, setDeletingDiagram] = useState<Diagram | null>(null)

  const fetchExecutionOptions = useCallback(
    async ({ search: s, page: p, pageSize: ps }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getAllExecutions(organizationId, {
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
    [organizationId],
  )

  const filterDefs = useMemo<HuemulFilterDef[]>(() => {
    const defs: HuemulFilterDef[] = [
      {
        key: 'search',
        type: 'text',
        group: tFilters('groups.search'),
        toolbar: true,
        label: t('common:search', 'Search'),
        placeholder: t('header.searchPlaceholder'),
        inputClassName: 'w-56',
      },
    ]

    // El combobox de ejecuciones pega a GET /execution/: sin permiso sobre ese
    // recurso el filtro se omite (y con él su chip), en vez de dejar que el
    // usuario dispare un 403 al abrirlo.
    if (canListExecutions) {
      defs.push({
        key: 'executionId',
        type: 'async-combobox',
        group: tFilters('groups.classification'),
        toolbar: true,
        label: t('filters.execution'),
        placeholder: t('filters.executionPlaceholder'),
        fetchOptions: fetchExecutionOptions,
        pageSize: 50,
        searchOnEnter: true,
      })
    }

    return defs
  }, [t, tFilters, fetchExecutionOptions, canListExecutions])

  const {
    values,
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
  const executionId = canListExecutions ? (values.executionId as string) || undefined : undefined

  const { data: diagramsResponse, isLoading, isFetching, error } = useDiagrams(
    organizationId,
    {
      // La lista solo se pide con el sheet abierto: es un selector, no el
      // contenido permanente de la página.
      enabled: open && !!organizationId && canList,
      page,
      pageSize,
      search: searchTerm,
      executionId,
    },
  )

  const { isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!diagramsResponse,
  })

  const items = diagramsResponse?.data ?? []
  const hasActiveFilters = activeCount > 0 || !!searchTerm

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: diagramQueryKeys.listBase() })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <>
      <HuemulSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t('header.title')}
        icon={Workflow}
        showFooter={false}
        size="wide"
      >
        <div className="flex h-full flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {onCreate && (
              <HuemulButton size="sm" icon={Plus} onClick={onCreate}>
                {t('relatedSheet.createAction')}
              </HuemulButton>
            )}
            <HuemulFilterInline
              filters={filterDefs}
              values={values}
              onChange={handleFilterChange}
              onSelectedLabel={setSelectedLabel}
            />
            <HuemulButton
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8"
              icon={RefreshCw}
              iconClassName="h-4 w-4"
              tooltip={t('common:refresh')}
              loading={isRefreshing || isFetching}
              onClick={handleRefresh}
            />
          </div>

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
          ) : items.length === 0 && !hasActiveFilters && !isTableLoading ? (
            <DiagramsContentEmptyState type="empty" />
          ) : items.length === 0 && hasActiveFilters && !isTableLoading ? (
            <DiagramsContentEmptyState type="no-results" onClearFilters={handleClearAll} />
          ) : (
            <DiagramsTable
              items={items}
              onView={onSelect}
              onDelete={(diagram: Diagram) => setDeletingDiagram(diagram)}
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
      </HuemulSheet>

      <DiagramsDeleteDialog
        open={!!deletingDiagram}
        onOpenChange={(o) => { if (!o) setDeletingDiagram(null) }}
        diagram={deletingDiagram}
        organizationId={organizationId}
        canDelete={canDelete}
      />
    </>
  )
}
