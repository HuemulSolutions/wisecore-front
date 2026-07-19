import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { RefreshCw, Plus } from "lucide-react"
import { toast } from "sonner"

import { useMediaList, mediaQueryKeys } from "@/hooks/useMedia"
import { useMediaViewMode } from "@/hooks/useMediaViewMode"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { handleApiError } from "@/lib/error-utils"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulPagination } from "@/huemul/components/huemul-pagination"
import { HuemulViewToggle } from "@/huemul/components/huemul-view-toggle"
import { HuemulMediaGallery } from "@/huemul/components/huemul-media-gallery"
import { HuemulMediaDetailSheet } from "@/huemul/components/huemul-media-detail-sheet"
import { HuemulMediaUploadSheet } from "@/huemul/components/huemul-media-upload-sheet"
import type { Media } from "@/types/media"

interface TemplateMediaTabProps {
  templateId: string
  organizationId: string
  canCreate: boolean
  canDelete: boolean
}

export function TemplateMediaTab({
  templateId,
  organizationId,
  canCreate,
  canDelete,
}: TemplateMediaTabProps) {
  const { t } = useTranslation(["media", "common"])
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Media | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [viewMode, setViewMode] = useMediaViewMode()

  const { data, isLoading, isFetching, isError, refetch } = useMediaList(
    organizationId,
    "template",
    {
      enabled: !!organizationId && !!templateId,
      page,
      pageSize,
      parentId: templateId,
    },
  )

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
      toast.success(t("media:refreshSuccess"))
    } catch (error) {
      handleApiError(error, { fallbackMessage: t("media:refreshError") })
    } finally {
      setIsRefreshing(false)
    }
  }

  const items = data?.data ?? []

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Fixed header */}
      <div className="px-4 pt-6 pb-4 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">{t("media:templateTab.title")}</h2>
            <p className="text-xs text-muted-foreground">{t("media:templateTab.description")}</p>
          </div>
          <div className="flex items-center gap-2">
            <HuemulViewToggle value={viewMode} onChange={setViewMode} />
            <HuemulButton
              variant="outline"
              size="sm"
              icon={RefreshCw}
              iconClassName="w-3 h-3 mr-1"
              label={t("common:refresh")}
              loading={isRefreshing || isFetching}
              onClick={handleRefresh}
              className="h-8 text-xs px-2"
            />
            {canCreate && (
              <HuemulButton
                size="sm"
                icon={Plus}
                iconClassName="w-3 h-3 mr-1"
                label={t("media:upload.title")}
                onClick={() => setUploadOpen(true)}
                className="h-8 text-xs px-2"
              />
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6">
        <HuemulMediaGallery
          items={items}
          viewMode={viewMode}
          isLoading={isTableLoading}
          isFetching={isTableFetching}
          isError={isError}
          onRetry={handleRefresh}
          onSelect={(item) => {
            setSelectedItem(item)
            setDetailOpen(true)
          }}
          emptyTitle={t("media:templateTab.empty")}
          emptyDescription={t("media:templateTab.emptyDescription")}
          loadError={t("media:loadError")}
          retryLabel={t("common:tryAgain")}
        />
      </div>

      {(items.length > 0 || page > 1) && (
        <div className="shrink-0 border-t bg-background px-4 pt-2">
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

      <HuemulMediaDetailSheet
        item={selectedItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        organizationId={organizationId}
        canDelete={canDelete}
      />

      <HuemulMediaUploadSheet
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        organizationId={organizationId}
        fixedLevel={{ level: "template", parentId: templateId }}
      />
    </div>
  )
}
