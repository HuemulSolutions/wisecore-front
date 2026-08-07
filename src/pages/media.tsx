import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Image, RefreshCw, Plus, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { useOrganization } from "@/contexts/organization-context"
import { useMediaList, mediaQueryKeys } from "@/hooks/useMedia"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"
import { HuemulPagination } from "@/huemul/components/huemul-pagination"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulFilterButton } from "@/huemul/components/huemul-filter-button"
import { HuemulFilterChips } from "@/huemul/components/huemul-filter-chips"
import { HuemulFilterPanel } from "@/huemul/components/huemul-filter-panel"
import { HuemulViewToggle } from "@/huemul/components/huemul-view-toggle"
import { HuemulMediaGallery } from "@/huemul/components/huemul-media-gallery"
import { HuemulMediaDetailSheet } from "@/huemul/components/huemul-media-detail-sheet"
import { HuemulMediaUploadSheet } from "@/huemul/components/huemul-media-upload-sheet"
import { HuemulMediaGenerateSheet } from "@/huemul/components/huemul-media-generate-sheet"
import { useMediaFilters } from "@/hooks/useMediaFilters"
import { useMediaViewMode } from "@/hooks/useMediaViewMode"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import type { Media } from "@/types/media"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = DEFAULT_PAGE_SIZE_OPTIONS

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function MediaPageSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MediaPage() {
  const { t } = useTranslation("media")
  const { t: tCommon } = useTranslation("common")
  const { selectedOrganizationId } = useOrganization()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Media | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [pinnedMediaIds, setPinnedMediaIds] = useState<string[]>([])
  const [viewMode, setViewMode] = useMediaViewMode()

  const {
    level,
    parentId,
    mediaType,
    needsParent,
    filterDefs,
    values,
    filtersOpen,
    setFiltersOpen,
    activeCount,
    chips,
    onFilterChange: handleFilterChange,
    onChipRemove: handleChipRemove,
    onClearAll: handleClearAll,
    onSelectedLabel,
  } = useMediaFilters({ onChange: () => { setPage(1); setPinnedMediaIds([]) } })

  const { data, isLoading, isFetching, isError, refetch } = useMediaList(
    selectedOrganizationId ?? "",
    level,
    {
      enabled: !!selectedOrganizationId && (level === "organization" || !!parentId),
      page,
      pageSize,
      mediaType,
      parentId,
    },
  )

  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!data,
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setPinnedMediaIds([])
    try {
      await queryClient.invalidateQueries({ queryKey: mediaQueryKeys.listBase() })
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleGenerateOpenChange = async (v: boolean) => {
    setGenerateOpen(v)
    if (!v && hasGenerated) {
      setHasGenerated(false)
      if (level !== "organization") {
        toast.info(t("generate.hiddenByFilters"))
      }
      // Invalida a mano (en vez de handleRefresh) para no limpiar el pin recién fijado.
      await queryClient.invalidateQueries({ queryKey: mediaQueryKeys.pickerBase() })
      await queryClient.invalidateQueries({ queryKey: mediaQueryKeys.listBase() })
      await refetch()
    }
  }

  if (!selectedOrganizationId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        {t("noOrganization")}
      </div>
    )
  }

  if (showPageLoader) {
    return <MediaPageSkeleton />
  }

  const rawItems = data?.data ?? []
  // Pin "solo ids": reordena filas que el backend ya devolvió, sin inventar
  // datos sintéticos (la respuesta de /image-generation/generate no trae
  // file_size/content_type/created_at).
  const items = pinnedMediaIds.length
    ? [...rawItems].sort((a, b) => {
        const ra = pinnedMediaIds.indexOf(a.id)
        const rb = pinnedMediaIds.indexOf(b.id)
        return (ra === -1 ? Infinity : ra) - (rb === -1 ? Infinity : rb)
      })
    : rawItems

  const header = (
    <div className="flex items-center justify-between gap-2 px-4 py-3">
      <div className="flex items-center gap-2">
        <HuemulFilterButton
          count={activeCount}
          open={filtersOpen}
          onToggle={() => setFiltersOpen(!filtersOpen)}
        />
        <Image className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        <h1 className="text-lg sm:text-xl font-semibold text-foreground">{t("title")}</h1>
        {data?.total != null && (
          <Badge variant="outline" className="text-xs px-2 py-1">
            {t("totalItems")}: {data.total}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <HuemulViewToggle value={viewMode} onChange={setViewMode} />
        <HuemulButton
          variant="outline"
          size="sm"
          icon={RefreshCw}
          iconClassName="w-3 h-3 mr-1"
          label={tCommon("refresh")}
          loading={isRefreshing || isFetching}
          onClick={handleRefresh}
          className="h-8 text-xs px-2"
        />
        <HuemulButton
          variant="outline"
          size="sm"
          icon={Sparkles}
          iconClassName="w-3 h-3 mr-1"
          label={t("generate.button")}
          onClick={() => setGenerateOpen(true)}
          className="h-8 text-xs px-2"
        />
        <HuemulButton
          size="sm"
          icon={Plus}
          iconClassName="w-3 h-3 mr-1"
          label={t("upload.title")}
          onClick={() => setUploadOpen(true)}
          className="h-8 text-xs px-2"
        />
      </div>
    </div>
  )

  return (
    <>
      <HuemulPageLayout
        header={header}
        columns={[
          {
            content: (
              <HuemulFilterPanel
                filters={filterDefs}
                values={values}
                onChange={handleFilterChange}
                onSelectedLabel={onSelectedLabel}
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
              <div className="flex flex-col h-full overflow-hidden p-4 md:p-6 gap-4">
                <HuemulFilterChips
                  chips={chips}
                  onRemove={handleChipRemove}
                  onClearAll={handleClearAll}
                />

                <div className="flex-1 min-h-0 overflow-y-auto">
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
                    emptyTitle={needsParent ? t("emptySelectParentTitle") : t("emptyTitle")}
                    emptyDescription={needsParent ? t("emptySelectParentDescription") : t("emptyDescription")}
                    loadError={t("loadError")}
                    retryLabel={tCommon("tryAgain")}
                  />
                </div>

                {(items.length > 0 || page > 1) && (
                  <div className="shrink-0 border-t bg-background pt-2">
                    <HuemulPagination
                      page={page}
                      pageSize={pageSize}
                      totalItems={data?.total}
                      hasNext={data?.has_next}
                      hasPrevious={page > 1}
                      onPageChange={(p) => { setPage(p); setPinnedMediaIds([]) }}
                      onPageSizeChange={(size) => {
                        setPageSize(size)
                        setPage(1)
                        setPinnedMediaIds([])
                      }}
                      pageSizeOptions={PAGE_SIZE_OPTIONS}
                    />
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />

    <HuemulMediaDetailSheet
      item={selectedItem}
      open={detailOpen}
      onOpenChange={setDetailOpen}
      organizationId={selectedOrganizationId}
    />

    <HuemulMediaUploadSheet
      open={uploadOpen}
      onOpenChange={setUploadOpen}
      organizationId={selectedOrganizationId}
    />

    <HuemulMediaGenerateSheet
      open={generateOpen}
      onOpenChange={handleGenerateOpenChange}
      organizationId={selectedOrganizationId}
      onGenerated={(img) => {
        setHasGenerated(true)
        setPinnedMediaIds((prev) => [img.media_id, ...prev])
      }}
    />
  </>
  )
}
