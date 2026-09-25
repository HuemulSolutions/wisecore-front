"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { FolderTree, RefreshCw, Search, Trash2, Workflow, X } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulAssetTreePickerDialog } from "@/huemul/components/huemul-asset-tree-picker"
import { HuemulFilterInline } from "@/huemul/components/huemul-filter-inline"
import { HuemulPagination } from "@/huemul/components/huemul-pagination"
import { HuemulPanelEmptyState } from "@/huemul/components/huemul-panel-empty-state"
import { HuemulTruncatedText } from "@/huemul/components/huemul-truncated-text"
import { Skeleton } from "@/components/ui/skeleton"
import { useHuemulFilters } from "@/hooks/useHuemulFilters"
import { useDiagrams, diagramQueryKeys } from "@/hooks/useDiagrams"
import { cn } from "@/lib/utils"
import type { HuemulFilterDef } from "@/types/huemul"
import type { Diagram } from "@/types/diagrams"
import { DiagramsRailPanel } from "./diagrams-rail-panel"

// El panel es una lista de scroll: 100 por página (default del hook) evita paginar para encontrar un diagrama.
const PANEL_PAGE_SIZE = 100
/** Espera tras la última tecla antes de consultar; Enter consulta al instante. */
const SEARCH_DEBOUNCE_MS = 400

export interface DiagramsListPanelProps {
  organizationId: string
  activeDiagramId?: string | null
  onSelect: (diagram: Diagram) => void
  onCreate?: () => void
  /** Pide confirmar el borrado; el diálogo vive en la página (el panel cierra al hacer clic fuera). */
  onRequestDelete?: (diagram: Diagram) => void
  /** `diagram:d`: sin permiso no se renderiza la papelera de cada fila. */
  canDelete: boolean
  /** `asset:l` + `folder:l`: sin ellos no se puede abrir el árbol, así que no hay filtro por activo. */
  canBrowseAssets: boolean
  /** Con permiso el árbol permite además elegir una versión concreta del activo. */
  canListExecutions: boolean
  onClose: () => void
  onCloseFocusRef?: React.RefObject<HTMLButtonElement | null>
}

/**
 * Única fuente del listado de diagramas: búsqueda (con debounce), filtro por
 * activo o versión (árbol de la biblioteca), paginación y eliminar por fila.
 */
export function DiagramsListPanel({
  organizationId,
  activeDiagramId,
  onSelect,
  onCreate,
  onRequestDelete,
  canDelete,
  canBrowseAssets,
  canListExecutions,
  onClose,
  onCloseFocusRef,
}: DiagramsListPanelProps) {
  const { t, i18n } = useTranslation(["diagrams", "common"])
  const { t: tFilters } = useTranslation("huemul-filters")
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filtro por activo (`document_id`) o versión (`execution_id`), excluyentes. No vive en
  // useHuemulFilters: su valor necesita el tipo, no solo un string.
  const [scope, setScope] = useState<{ kind: "document" | "execution"; id: string; label: string } | null>(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const filterDefs = useMemo<HuemulFilterDef[]>(() => {
    const defs: HuemulFilterDef[] = [
      {
        key: 'search',
        type: 'text',
        group: tFilters('groups.search'),
        toolbar: true,
        label: t('common:search', 'Search'),
        placeholder: t('header.searchPlaceholder'),
        icon: Search,
        // Sin esto cada tecla sería un GET /diagrams; Enter sigue consultando al instante.
        debounceMs: SEARCH_DEBOUNCE_MS,
        inputClassName: 'w-full',
      },
    ]
    return defs
  }, [t, tFilters])

  const { values, setValue, clearAll, setSelectedLabel } = useHuemulFilters({
    filters: filterDefs,
    defaultOpen: false,
  })

  // Un cambio solo de espacios comparte query key con el anterior: React Query no re-pide.
  const search = ((values.search as string) || '').trim() || undefined
  const hasActiveFilters = !!search || !!scope

  // Volver a la página 1 al cambiar un filtro, sin efecto ni setPage en el handler:
  // la página guardada solo vale mientras coincida la clave de filtros con la que se eligió.
  const filterKey = `${search ?? ''}|${scope?.kind ?? ''}:${scope?.id ?? ''}`
  const [pageState, setPageState] = useState({ key: '', page: 1 })
  const page = pageState.key === filterKey ? pageState.page : 1
  const setPage = (next: number) => setPageState({ key: filterKey, page: next })

  const { data, isLoading, isFetching, error } = useDiagrams(organizationId, {
    enabled: !!organizationId,
    page,
    pageSize: PANEL_PAGE_SIZE,
    search,
    documentId: scope?.kind === 'document' ? scope.id : undefined,
    executionId: scope?.kind === 'execution' ? scope.id : undefined,
  })

  const items = data?.data ?? []
  const currentPage = data?.page ?? page
  const hasNext = data?.has_next ?? false
  const shown = (currentPage - 1) * PANEL_PAGE_SIZE + items.length
  const total = hasNext ? `${shown}+` : String(shown)

  const clearFilters = () => {
    clearAll()
    setScope(null)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: diagramQueryKeys.listBase() })
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: "numeric", month: "short", year: "numeric" })

  return (
    <DiagramsRailPanel
      title={t("header.title")}
      counter={t("listPanel.counter", { shown, total })}
      onClose={onClose}
      onCloseFocusRef={onCloseFocusRef}
      actions={
        <HuemulButton
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          icon={RefreshCw}
          iconClassName="h-4 w-4"
          tooltip={t("common:refresh")}
          aria-label={t("common:refresh")}
          loading={isRefreshing || isFetching}
          onClick={handleRefresh}
        />
      }
    >
      <div className="shrink-0 border-b border-[#e9edf2] p-2">
        <HuemulFilterInline
          className="flex-col items-stretch"
          filters={filterDefs}
          values={values}
          onChange={setValue}
          onSelectedLabel={setSelectedLabel}
        />
        {canBrowseAssets && (
          <div className="mt-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              title={scope?.label ?? t("listPanel.assetFilterPlaceholder")}
              className={cn(
                "flex h-8 min-w-0 flex-1 items-center justify-between gap-2 rounded-md border bg-background px-2.5 text-xs hover:cursor-pointer hover:bg-accent",
                !scope && "text-muted-foreground",
              )}
            >
              <span className="truncate">{scope?.label ?? t("listPanel.assetFilterPlaceholder")}</span>
              <FolderTree className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
            {scope && (
              <button
                type="button"
                title={t("listPanel.assetFilterClear")}
                aria-label={t("listPanel.assetFilterClear")}
                onClick={() => setScope(null)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 hover:cursor-pointer hover:bg-[#f4f6f9] hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <HuemulAssetTreePickerDialog
              open={isPickerOpen}
              onOpenChange={setIsPickerOpen}
              organizationId={organizationId}
              mode={canListExecutions ? "document-with-version" : "document"}
              value={scope?.id}
              title={t("listPanel.assetFilterTitle")}
              description={t("listPanel.assetFilterDescription")}
              onSelect={(id, label, meta) => setScope({ kind: meta?.kind ?? "document", id, label })}
            />
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {error ? (
          <HuemulPanelEmptyState
            className="m-3"
            icon={Workflow}
            title={t("contentEmptyState.errorTitle")}
            description={(error as Error).message || t("contentEmptyState.errorDescription")}
            action={{ label: t("common:retry"), onClick: handleRefresh }}
          />
        ) : isLoading ? (
          <div className="space-y-2 p-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          hasActiveFilters ? (
            <HuemulPanelEmptyState
              className="m-3"
              icon={Search}
              title={
                search
                  ? t("listPanel.noResults", { term: search })
                  : scope
                    ? t("listPanel.noResultsScope", { label: scope.label })
                    : t("listPanel.noResultsFilters")
              }
              description={t("contentEmptyState.noResultsDescription")}
              action={{ label: t("actions.clearFilters"), onClick: clearFilters }}
            />
          ) : (
            <HuemulPanelEmptyState
              className="m-3"
              icon={Workflow}
              title={t("listPanel.emptyTitle")}
              description={t("listPanel.emptyDescription")}
              action={onCreate ? { label: t("relatedSheet.createAction"), onClick: onCreate } : undefined}
            />
          )
        ) : (
          <ul className={cn("p-1.5 transition-opacity", isFetching && "opacity-60")}>
            {items.map((diagram) => (
              <li
                key={diagram.id}
                className={cn(
                  "flex items-center gap-1 rounded-lg transition-colors hover:bg-[#f4f6f9]",
                  diagram.id === activeDiagramId && "bg-[#eef2ff]",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(diagram)}
                  aria-current={diagram.id === activeDiagramId ? "true" : undefined}
                  className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left hover:cursor-pointer"
                >
                  <HuemulTruncatedText
                    text={diagram.name}
                    className="text-[13px] font-medium text-[#0f172a]"
                  />
                  <span className="text-[11.5px] text-slate-400">
                    {t("listPanel.updatedAt", { date: formatDate(diagram.updated_at) })}
                  </span>
                </button>
                {canDelete && onRequestDelete && (
                  <button
                    type="button"
                    title={t("actions.deleteDiagram")}
                    aria-label={t("actions.deleteDiagram")}
                    onClick={() => onRequestDelete(diagram)}
                    className="mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-400 hover:cursor-pointer hover:bg-white hover:text-[#dc2626]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-[#e9edf2] px-2 py-1.5">
        <HuemulPagination
          variant="bare"
          page={currentPage}
          pageSize={PANEL_PAGE_SIZE}
          hasNext={hasNext}
          hasPrevious={currentPage > 1}
          onPageChange={setPage}
          // GET /diagrams no devuelve `total`: sin número de páginas, primera/última no tienen a dónde ir.
          showFirstLast={false}
        />
      </div>
    </DiagramsRailPanel>
  )
}
