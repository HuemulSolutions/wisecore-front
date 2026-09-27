import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Paperclip, RefreshCw } from "lucide-react"
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
import { HuemulMediaScopeSelector } from "@/huemul/components/huemul-media-scope-selector"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { getExecutionCompactLabel } from "@/components/assets/content/utils/version-utils"
import type { Media, MediaLevel, MediaScope, MediaScopeExecutionOption } from "@/types/media"

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
  allExecutions?: MediaScopeExecutionOption[]
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

  const [scope, setScope] = useState<MediaScope>({ level, parentId })

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
            {documentId && allExecutions?.length ? (
              <HuemulMediaScopeSelector
                scope={scope}
                onScopeChange={setScope}
                documentId={documentId}
                executions={allExecutions}
                activeExecutionLabel={scope.level === "execution" ? titleName : undefined}
              />
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
