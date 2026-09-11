import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { ChevronDown, History, Paperclip, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { useMediaList, useMediaMutations, mediaQueryKeys } from "@/hooks/useMedia"
import { useMediaViewMode } from "@/hooks/useMediaViewMode"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulPagination } from "@/huemul/components/huemul-pagination"
import { HuemulViewToggle } from "@/huemul/components/huemul-view-toggle"
import { HuemulMediaGallery } from "@/huemul/components/huemul-media-gallery"
import { HuemulMediaDetailSheet } from "@/huemul/components/huemul-media-detail-sheet"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getExecutionCompactLabel, getExecutionDisplayLabel } from "@/components/assets/content/utils/version-utils"
import { formatAbsoluteDate } from "@/lib/format-relative-time"
import { parseApiDate } from "@/lib/utils"
import type { Media, MediaLevel } from "@/types/media"

export interface MediaSheetExecutionOption {
  id: string
  created_at: string
  name: string
  status?: string
  version?: string | null
  version_major?: number | null
  version_minor?: number | null
  version_patch?: number | null
  created_by_user?: { name: string; last_name: string } | null
}

type MediaSheetScope = { level: Extract<MediaLevel, "document" | "execution">; parentId: string }

export interface MediaListSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  /** Alcance con el que abre el sheet — el usuario puede cambiarlo desde adentro si se pasan documentId+allExecutions. */
  level: Extract<MediaLevel, "document" | "execution">
  /** documentId (level="document") o executionId (level="execution"). */
  parentId: string
  /** Nombre del asset o label de la versión, para el título del sheet (fallback si no se puede resolver desde el scope actual). */
  parentLabel?: string
  /** Id del documento, para la opción "Documento completo" del selector de versión. */
  documentId?: string
  /** Nombre del documento, para el título cuando el alcance es "Documento completo". */
  documentLabel?: string
  /** Versiones del documento. Sin esto (o vacío) no se muestra el selector y el sheet queda fijo en level/parentId, como antes. */
  allExecutions?: MediaSheetExecutionOption[]
  canCreate: boolean // media:createMedia — subir versión nueva desde el detalle
  canUpdate: boolean // media:updateMedia — editar nombre/descripción desde el detalle
  canDelete: boolean // media:deleteMedia — eliminar inline + eliminar desde el detalle
}

export function MediaListSheet({
  open,
  onOpenChange,
  organizationId,
  level,
  parentId,
  parentLabel,
  documentId,
  documentLabel,
  allExecutions,
  canCreate,
  canUpdate,
  canDelete,
}: MediaListSheetProps) {
  const { t } = useTranslation(["media", "common"])
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [viewMode, setViewMode] = useMediaViewMode()
  const [selectedItem, setSelectedItem] = useState<Media | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Media | null>(null)

  const [scope, setScope] = useState<MediaSheetScope>({ level, parentId })
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false)
  const selectedExecutionItemRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!scopeMenuOpen) return
    // El contenido del dropdown recién se monta al abrir — esperar el próximo frame antes de scrollear.
    const raf = requestAnimationFrame(() => {
      selectedExecutionItemRef.current?.scrollIntoView({ block: "nearest" })
    })
    return () => cancelAnimationFrame(raf)
  }, [scopeMenuOpen])

  const wasOpenRef = useRef(open)
  useEffect(() => {
    // Resincroniza el alcance con lo que trae el padre solo al re-abrir el sheet —
    // mientras está abierto, manda el selector interno del usuario.
    if (open && !wasOpenRef.current) {
      setScope({ level, parentId })
    }
    wasOpenRef.current = open
  }, [open, level, parentId])

  useEffect(() => {
    setPage(1)
  }, [scope.level, scope.parentId])

  const { deleteMedia } = useMediaMutations(organizationId)

  const { data, isLoading, isFetching, isError, refetch } = useMediaList(
    organizationId,
    scope.level,
    {
      enabled: open && !!organizationId && !!scope.parentId,
      page,
      pageSize,
      parentId: scope.parentId,
    },
  )

  const showScopeSelector = !!documentId && !!allExecutions?.length
  const sortedExecutions = showScopeSelector
    ? [...allExecutions!].sort((a, b) => parseApiDate(b.created_at).getTime() - parseApiDate(a.created_at).getTime())
    : []
  const scopeExecution = scope.level === "execution" ? allExecutions?.find((e) => e.id === scope.parentId) : undefined
  const titleName =
    scope.level === "document"
      ? (documentLabel ?? parentLabel)
      : (scopeExecution ? getExecutionCompactLabel(scopeExecution) : parentLabel)

  const { isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!data,
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: mediaQueryKeys.listBase() })
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const items = data?.data ?? []

  return (
    <>
      <HuemulSheet
        open={open}
        onOpenChange={onOpenChange}
        title={titleName ? t("media:listSheet.titleWithName", { name: titleName }) : t("media:listSheet.title")}
        description={t("media:listSheet.description")}
        icon={Paperclip}
        showFooter={false}
        maxWidth="sm:max-w-4xl"
      >
        <div className="flex flex-col h-full -mx-6">
          <div className="flex items-center justify-between px-6 pb-3 mb-3 border-b border-gray-100 gap-2">
            {showScopeSelector ? (
              <DropdownMenu open={scopeMenuOpen} onOpenChange={setScopeMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <HuemulButton
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs font-medium"
                    tooltip={t("media:listSheet.scope.trigger")}
                  >
                    <History className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    <span className="truncate max-w-40">
                      {scope.level === "document" ? t("media:listSheet.scope.document") : (titleName || t("media:listSheet.scope.document"))}
                    </span>
                    <ChevronDown className="h-3 w-3 text-gray-400 shrink-0" />
                  </HuemulButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72">
                  <DropdownMenuItem
                    className={`hover:cursor-pointer ${scope.level === "document" ? "bg-blue-50 text-[#4464f7]" : ""}`}
                    onClick={() => setScope({ level: "document", parentId: documentId! })}
                  >
                    {t("media:listSheet.scope.document")}
                  </DropdownMenuItem>
                  <div className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    {t("media:listSheet.scope.versionsHeading")}
                  </div>
                  <div className="overflow-y-auto max-h-64">
                    {sortedExecutions.map((execution) => {
                      const isSelected = scope.level === "execution" && scope.parentId === execution.id
                      return (
                        <DropdownMenuItem
                          key={execution.id}
                          ref={isSelected ? selectedExecutionItemRef : undefined}
                          className={`hover:cursor-pointer ${isSelected ? "bg-blue-50" : ""}`}
                          onClick={() => setScope({ level: "execution", parentId: execution.id })}
                        >
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className={`text-sm truncate ${isSelected ? "font-semibold text-[#4464f7]" : "text-gray-900"}`}>
                              {getExecutionDisplayLabel(execution)}
                            </span>
                            <span className="text-xs text-gray-500 truncate">
                              {[
                                execution.created_at ? formatAbsoluteDate(execution.created_at) : null,
                                execution.created_by_user
                                  ? `${execution.created_by_user.name} ${execution.created_by_user.last_name}`.trim()
                                  : null,
                              ].filter(Boolean).join(" · ")}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      )
                    })}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <HuemulViewToggle value={viewMode} onChange={setViewMode} />
              <HuemulButton
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                icon={RefreshCw}
                tooltip={t("common:refresh")}
                loading={isRefreshing || isFetching}
                onClick={handleRefresh}
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
            <HuemulMediaGallery
              items={items}
              gridClassName="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
              viewMode={viewMode}
              isLoading={isTableLoading}
              isFetching={isTableFetching}
              isError={isError}
              onRetry={handleRefresh}
              onSelect={(item) => {
                setSelectedItem(item)
                setDetailOpen(true)
              }}
              onDelete={canDelete ? (item) => setDeleteTarget(item) : undefined}
              deleteLabel={t("media:detail.deleteMedia")}
              emptyTitle={t("media:listSheet.emptyTitle")}
              emptyDescription={t("media:listSheet.emptyDescription")}
              loadError={t("media:loadError")}
              retryLabel={t("common:tryAgain")}
            />
          </div>

          {(items.length > 0 || page > 1) && (
            <div className="shrink-0 border-t bg-background px-6 pt-2">
              <HuemulPagination
                page={page}
                pageSize={pageSize}
                totalItems={data?.total}
                hasNext={data?.has_next}
                hasPrevious={page > 1}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size)
                  setPage(1)
                }}
                pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
              />
            </div>
          )}
        </div>
      </HuemulSheet>

      <HuemulMediaDetailSheet
        item={selectedItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        organizationId={organizationId}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />

      <HuemulAlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}
        title={t("media:detail.deleteMediaTitle")}
        description={t("media:detail.deleteMediaDescription")}
        actionLabel={t("media:detail.deleteMediaConfirm")}
        onAction={async () => {
          if (!deleteTarget) return
          await deleteMedia.mutateAsync(deleteTarget.id)
          toast.success(t("media:detail.deleteMediaSuccess"))
          setDeleteTarget(null)
        }}
      />
    </>
  )
}
