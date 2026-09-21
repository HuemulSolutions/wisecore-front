"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, RefreshCw, Search, Workflow } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulPanelEmptyState } from "@/huemul/components/huemul-panel-empty-state"
import { HuemulTruncatedText } from "@/huemul/components/huemul-truncated-text"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useDiagrams, diagramQueryKeys } from "@/hooks/useDiagrams"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { cn } from "@/lib/utils"
import type { Diagram } from "@/types/diagrams"
import { DiagramsRailPanel } from "./diagrams-rail-panel"

const PANEL_PAGE_SIZE = 20

export interface DiagramsListPanelProps {
  organizationId: string
  activeDiagramId?: string | null
  onSelect: (diagram: Diagram) => void
  onCreate?: () => void
  /** Abre el sheet ancho con filtro por ejecución, page-size y eliminar. */
  onViewAll: () => void
  onClose: () => void
  onCloseFocusRef?: React.RefObject<HTMLButtonElement | null>
}

/**
 * Listado compacto de diagramas dentro del riel. La tabla completa (filtro por
 * ejecución, page-size, eliminar) sigue viviendo en `DiagramsListSheet`.
 */
export function DiagramsListPanel({
  organizationId,
  activeDiagramId,
  onSelect,
  onCreate,
  onViewAll,
  onClose,
  onCloseFocusRef,
}: DiagramsListPanelProps) {
  const { t, i18n } = useTranslation(["diagrams", "common"])
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data, isLoading, isFetching, error } = useDiagrams(organizationId, {
    enabled: !!organizationId,
    page,
    pageSize: PANEL_PAGE_SIZE,
    search: search.trim() || undefined,
  })
  const { isTableLoading } = useTableLoadingState({ isLoading, isFetching, hasData: !!data })

  const items = data?.data ?? []
  const currentPage = data?.page ?? page
  const hasNext = data?.has_next ?? false
  const shown = (currentPage - 1) * PANEL_PAGE_SIZE + items.length
  const total = hasNext ? `${shown}+` : String(shown)
  const isSearching = search.trim().length > 0

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
      <div className="relative shrink-0 border-b border-[#e9edf2] p-2">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder={t("header.searchPlaceholder")}
          aria-label={t("header.searchPlaceholder")}
          className="h-8 pl-8 text-xs"
        />
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
        ) : isTableLoading ? (
          <div className="space-y-2 p-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          isSearching ? (
            <HuemulPanelEmptyState
              className="m-3"
              icon={Search}
              title={t("listPanel.noResults", { term: search.trim() })}
              description={t("contentEmptyState.noResultsDescription")}
              action={{ label: t("actions.clearFilters"), onClick: () => setSearch("") }}
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
          <ul className="p-1.5">
            {items.map((diagram) => (
              <li key={diagram.id}>
                <button
                  type="button"
                  onClick={() => onSelect(diagram)}
                  aria-current={diagram.id === activeDiagramId ? "true" : undefined}
                  className={cn(
                    "flex w-full flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:cursor-pointer hover:bg-[#f4f6f9]",
                    diagram.id === activeDiagramId && "bg-[#eef2ff]",
                  )}
                >
                  <HuemulTruncatedText
                    text={diagram.name}
                    className="text-[13px] font-medium text-[#0f172a]"
                  />
                  <span className="text-[11.5px] text-slate-400">
                    {t("listPanel.updatedAt", { date: formatDate(diagram.updated_at) })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[#e9edf2] px-2 py-1.5">
        <HuemulButton variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onViewAll}>
          {t("listPanel.viewAll")}
        </HuemulButton>
        <div className="flex items-center gap-0.5">
          <HuemulButton
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            icon={ChevronLeft}
            aria-label={t("common:previous", "Previous")}
            tooltip={t("common:previous", "Previous")}
            disabled={currentPage <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          />
          <HuemulButton
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            icon={ChevronRight}
            aria-label={t("common:next", "Next")}
            tooltip={t("common:next", "Next")}
            disabled={!hasNext || isFetching}
            onClick={() => setPage((p) => p + 1)}
          />
        </div>
      </div>
    </DiagramsRailPanel>
  )
}
