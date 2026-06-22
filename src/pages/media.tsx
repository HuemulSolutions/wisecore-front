import { useState, useRef, useMemo, useCallback } from "react"
import type { TFunction } from "i18next"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Image, FileText, File, Film, Music, Archive, AlertCircle, RefreshCw, Inbox, Download, History, Clock, Upload, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import { formatRelativeTime, formatAbsoluteDate } from "@/lib/format-relative-time"

import { useOrganization } from "@/contexts/organization-context"
import { useMediaList, useMediaVersions, useMediaMutations, mediaQueryKeys } from "@/hooks/useMedia"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { handleApiError } from "@/lib/error-utils"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulPagination } from "@/huemul/components/huemul-pagination"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { HuemulInfoDisplay, HuemulInfoGroup, HuemulInfoItem } from "@/huemul/components/huemul-info-display"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulFilterButton } from "@/huemul/components/huemul-filter-button"
import { HuemulFilterChips } from "@/huemul/components/huemul-filter-chips"
import { HuemulFilterPanel } from "@/huemul/components/huemul-filter-panel"
import { HuemulViewToggle } from "@/huemul/components/huemul-view-toggle"
import { useHuemulFilters } from "@/hooks/useHuemulFilters"
import { useMediaViewMode } from "@/hooks/useMediaViewMode"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { formatBytes } from "@/lib/format-bytes"
import type { Media, MediaVersion, MediaLevel } from "@/types/media"
import type { HuemulFilterDef, HuemulFilterValue } from "@/types/huemul"
import type { ViewMode } from "@/huemul/components/huemul-view-toggle"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/gif", "image/bmp"])
const IMAGE_ACCEPT = Array.from(IMAGE_TYPES).join(",")

function isImage(contentType?: string | null): boolean {
  return !!contentType && IMAGE_TYPES.has(contentType.toLowerCase())
}

function MediaIcon({ contentType, className }: { contentType?: string | null; className?: string }) {
  const cls = cn("shrink-0", className)
  if (!contentType) return <File className={cls} />
  if (isImage(contentType)) return <Image className={cn(cls, "text-blue-500")} />
  if (contentType.startsWith("video/")) return <Film className={cn(cls, "text-purple-500")} />
  if (contentType.startsWith("audio/")) return <Music className={cn(cls, "text-green-500")} />
  if (contentType.startsWith("text/") || contentType.includes("pdf")) return <FileText className={cn(cls, "text-orange-500")} />
  if (contentType.includes("zip") || contentType.includes("tar") || contentType.includes("gzip")) return <Archive className={cn(cls, "text-yellow-500")} />
  return <File className={cn(cls, "text-muted-foreground")} />
}

const LEVEL_VALUES = ["organization", "document_type", "document", "execution"] as const

/** Build the level select options with translated labels. */
function getLevelOptions(t: TFunction): { value: MediaLevel; label: string }[] {
  return LEVEL_VALUES.map((value) => ({ value, label: t(`filters.levels.${value}`) }))
}

const PAGE_SIZE_OPTIONS = [12, 24, 48]

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

// ─── Gallery card ─────────────────────────────────────────────────────────────

function MediaCard({ item, onClick }: { item: Media; onClick: () => void }) {
  const version = item.current_version
  const name = item.name ?? version?.original_filename ?? item.id
  const contentType = version?.content_type

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="group flex flex-col rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow hover:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {isImage(contentType) && version?.download_url ? (
          <img
            src={version.download_url}
            alt={name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <MediaIcon contentType={contentType} className="h-12 w-12 opacity-40" />
        )}
        {version && (
          <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
            v{version.version_number}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 p-2.5 min-w-0">
        <p className="text-xs font-medium truncate leading-tight" title={name}>
          {name}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {contentType && (
            <Badge variant="secondary" className="text-[10px] font-mono px-1 py-0 h-4 truncate max-w-28">
              {contentType.split("/")[1] ?? contentType}
            </Badge>
          )}
          {item.origin && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
              {item.origin}
            </Badge>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {formatBytes(version?.file_size)}
          {item.created_at && (
            <> · {formatRelativeTime(item.created_at)}</>
          )}
        </p>
      </div>
    </div>
  )
}

// ─── Version row ──────────────────────────────────────────────────────────────

function VersionRow({
  version,
  isCurrent,
  onDelete,
}: {
  version: MediaVersion
  isCurrent: boolean
  onDelete: () => void
}) {
  const { t } = useTranslation("media")

  function handleDownload() {
    const a = document.createElement("a")
    a.href = version.download_url
    a.download = version.original_filename
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    a.click()
  }

  return (
    <div className={cn(
      "flex items-start gap-3 rounded-lg border p-3",
      isCurrent && "border-primary/40 bg-primary/5",
    )}>
      <div className="flex flex-col items-center gap-1 shrink-0">
        <span className="font-mono text-xs font-semibold text-foreground">
          v{version.version_number}
        </span>
        {isCurrent && (
          <Badge variant="default" className="text-[9px] px-1 py-0 h-3.5 leading-none">
            {t("detail.current")}
          </Badge>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-xs font-medium truncate" title={version.original_filename}>
          {version.original_filename}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="text-[10px] text-muted-foreground font-mono">{version.content_type}</span>
          <span className="text-[10px] text-muted-foreground">{formatBytes(version.file_size)}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          <span title={version.created_at}>{formatAbsoluteDate(version.created_at)}</span>
        </div>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:cursor-pointer"
          onClick={handleDownload}
          title={t("detail.download")}
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:cursor-pointer text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          title={t("detail.deleteVersion")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ─── Upload media sheet ───────────────────────────────────────────────────────

function UploadMediaSheet({
  open,
  onOpenChange,
  organizationId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  organizationId: string
}) {
  const { t } = useTranslation("media")
  const [file, setFile] = useState<File | null>(null)
  const [level, setLevel] = useState<MediaLevel>("organization")
  const [name, setName] = useState("")
  const [summary, setSummary] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadMedia } = useMediaMutations(organizationId)

  function reset() {
    setFile(null)
    setName("")
    setSummary("")
    setLevel("organization")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSave() {
    if (!file) throw new Error("No file selected")
    await uploadMedia.mutateAsync({
      file,
      level,
      name: name.trim() || null,
      summary: summary.trim() || null,
    })
    toast.success(t("upload.success"))
    reset()
  }

  return (
    <HuemulSheet
      open={open}
      onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}
      title={t("upload.title")}
      icon={Upload}
      saveAction={{ label: t("upload.submit"), onClick: handleSave, disabled: !file }}
    >
      <div className="flex flex-col gap-4">
        {/* Drop zone */}
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:cursor-pointer hover:bg-muted/50",
            file ? "border-primary/40 bg-primary/5" : "border-muted-foreground/25",
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return
              if (f.type.startsWith("image/") && !IMAGE_TYPES.has(f.type.toLowerCase())) {
                toast.error(t("upload.invalidImageType", { formats: "PNG, JPG, GIF, BMP" }))
                if (fileInputRef.current) fileInputRef.current.value = ""
                return
              }
              setFile(f)
              if (!name) setName(f.name)
            }}
          />
          {file ? (
            <>
              <MediaIcon contentType={file.type} className="h-8 w-8" />
              <p className="text-sm font-medium truncate max-w-full px-4">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs hover:cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
              >
                {t("upload.changeFile")}
              </Button>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">{t("upload.dropzone")}</p>
              <p className="text-xs text-muted-foreground">{t("upload.dropzoneHint")}</p>
            </>
          )}
        </div>

        <HuemulField
          type="select"
          label={t("filters.level")}
          value={level}
          onChange={(v) => setLevel(v as MediaLevel)}
          options={getLevelOptions(t)}
        />
        <HuemulField
          type="text"
          label={t("upload.name")}
          value={name}
          onChange={(v) => setName(String(v ?? ""))}
          placeholder={t("upload.namePlaceholder")}
        />
        <HuemulField
          type="text"
          label={t("upload.summary")}
          value={summary}
          onChange={(v) => setSummary(String(v ?? ""))}
          placeholder={t("upload.summaryPlaceholder")}
        />
      </div>
    </HuemulSheet>
  )
}

// ─── Media detail sheet ───────────────────────────────────────────────────────

function MediaDetailSheet({
  item,
  open,
  onOpenChange,
  organizationId,
}: {
  item: Media | null
  open: boolean
  onOpenChange: (v: boolean) => void
  organizationId: string
}) {
  const { t } = useTranslation("media")
  const [deleteMediaOpen, setDeleteMediaOpen] = useState(false)
  const [deleteVersionTarget, setDeleteVersionTarget] = useState<MediaVersion | null>(null)
  const versionFileInputRef = useRef<HTMLInputElement>(null)

  const { deleteMedia, uploadMediaVersion, deleteMediaVersion } = useMediaMutations(organizationId)

  const { data: versionsData, isLoading: versionsLoading } = useMediaVersions(
    organizationId,
    item?.id ?? "",
    { enabled: open && !!item },
  )

  const versions = versionsData?.data ?? []
  const version = item?.current_version
  const name = item?.name ?? version?.original_filename ?? item?.id ?? ""
  const contentType = version?.content_type

  async function handleVersionUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !item) return
    if (file.type.startsWith("image/") && !IMAGE_TYPES.has(file.type.toLowerCase())) {
      toast.error(t("upload.invalidImageType", { formats: "PNG, JPG, GIF, BMP" }))
      if (versionFileInputRef.current) versionFileInputRef.current.value = ""
      return
    }
    try {
      await uploadMediaVersion.mutateAsync({ mediaId: item.id, body: { file } })
      toast.success(t("detail.uploadVersionSuccess"))
    } catch (err) {
      handleApiError(err, { fallbackMessage: t("detail.uploadVersionError") })
    } finally {
      if (versionFileInputRef.current) versionFileInputRef.current.value = ""
    }
  }

  return (
    <>
      <HuemulSheet
        open={open}
        onOpenChange={onOpenChange}
        title={name}
        description={contentType ?? ""}
        icon={Image}
        maxWidth="sm:max-w-lg"
        showFooter={false}
        extraActions={
          version
            ? [{
                label: t("detail.download"),
                icon: Download,
                position: "header" as const,
                closeOnSuccess: false,
                onClick: () => {
                  const a = document.createElement("a")
                  a.href = version.download_url
                  a.download = version.original_filename
                  a.target = "_blank"
                  a.rel = "noopener noreferrer"
                  a.click()
                },
              }]
            : []
        }
      >
        {item && (
          <div className="flex flex-col gap-5">
            {/* Preview */}
            {isImage(contentType) && version?.download_url ? (
              <div className="rounded-lg overflow-hidden border bg-muted flex items-center justify-center max-h-64">
                <img
                  src={version.download_url}
                  alt={name}
                  className="max-h-64 max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="rounded-lg border bg-muted flex items-center justify-center h-28">
                <MediaIcon contentType={contentType} className="h-12 w-12 opacity-40" />
              </div>
            )}

            {/* Metadata */}
            <HuemulInfoDisplay>
              <HuemulInfoGroup layout="grid-2">
                <HuemulInfoItem label={t("detail.name")} value={item.name} />
                <HuemulInfoItem label={t("detail.type")} value={item.type} />
                <HuemulInfoItem label={t("detail.origin")} value={item.origin} />
                <HuemulInfoItem label={t("detail.size")} value={formatBytes(version?.file_size)} />
                <HuemulInfoItem label={t("detail.contentType")} value={contentType} variant="code" />
                <HuemulInfoItem label={t("detail.createdAt")} value={item.created_at ? formatAbsoluteDate(item.created_at) : undefined} />
              </HuemulInfoGroup>
              {item.summary && (
                <HuemulInfoGroup>
                  <HuemulInfoItem label={t("detail.summary")} value={item.summary} />
                </HuemulInfoGroup>
              )}
            </HuemulInfoDisplay>

            <Separator />

            {/* Version history */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">{t("detail.versionHistory")}</span>
                  {versions.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{versions.length}</Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs hover:cursor-pointer"
                  onClick={() => versionFileInputRef.current?.click()}
                  disabled={uploadMediaVersion.isPending}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {t("detail.uploadVersion")}
                </Button>
                <input
                  ref={versionFileInputRef}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  className="sr-only"
                  onChange={handleVersionUpload}
                />
              </div>

              {versionsLoading || uploadMediaVersion.isPending ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : versions.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">{t("detail.noVersions")}</p>
              ) : (
                <div className="space-y-2">
                  {[...versions]
                    .sort((a, b) => b.version_number - a.version_number)
                    .map((v) => (
                      <VersionRow
                        key={v.id}
                        version={v}
                        isCurrent={v.is_current}
                        onDelete={() => setDeleteVersionTarget(v)}
                      />
                    ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Danger zone */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("detail.dangerZone")}
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="hover:cursor-pointer"
                onClick={() => setDeleteMediaOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                {t("detail.deleteMedia")}
              </Button>
            </div>
          </div>
        )}
      </HuemulSheet>

      {/* Delete media confirmation */}
      <HuemulAlertDialog
        open={deleteMediaOpen}
        onOpenChange={setDeleteMediaOpen}
        title={t("detail.deleteMediaTitle")}
        description={t("detail.deleteMediaDescription")}
        actionLabel={t("detail.deleteMediaConfirm")}
        onAction={async () => {
          await deleteMedia.mutateAsync(item!.id)
          toast.success(t("detail.deleteMediaSuccess"))
          onOpenChange(false)
        }}
      />

      {/* Delete version confirmation */}
      <HuemulAlertDialog
        open={!!deleteVersionTarget}
        onOpenChange={(v) => { if (!v) setDeleteVersionTarget(null) }}
        title={t("detail.deleteVersionTitle")}
        description={t("detail.deleteVersionDescription", { version: deleteVersionTarget?.version_number })}
        actionLabel={t("detail.deleteVersionConfirm")}
        onAction={async () => {
          await deleteMediaVersion.mutateAsync({
            mediaId: item!.id,
            versionNumber: deleteVersionTarget!.version_number,
          })
          toast.success(t("detail.deleteVersionSuccess"))
          setDeleteVersionTarget(null)
        }}
      />
    </>
  )
}

// ─── List row ─────────────────────────────────────────────────────────────────

function MediaRow({ item, onClick }: { item: Media; onClick: () => void }) {
  const version = item.current_version
  const name = item.name ?? version?.original_filename ?? item.id
  const contentType = version?.content_type

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="group flex items-center gap-3 rounded-lg border bg-card px-3 py-2 hover:shadow-sm transition-shadow hover:cursor-pointer hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative h-10 w-10 shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden">
        {isImage(contentType) && version?.download_url ? (
          <img src={version.download_url} alt={name} className="object-cover w-full h-full" loading="lazy" />
        ) : (
          <MediaIcon contentType={contentType} className="h-5 w-5 opacity-50" />
        )}
      </div>

      <p className="flex-1 min-w-0 truncate text-sm font-medium" title={name}>
        {name}
      </p>

      {item.origin && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 shrink-0 hidden sm:inline-flex">
          {item.origin}
        </Badge>
      )}
      {contentType && (
        <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 h-5 shrink-0">
          {contentType.split("/")[1] ?? contentType}
        </Badge>
      )}
      <span className="text-xs text-muted-foreground shrink-0 w-16 text-right tabular-nums">
        {formatBytes(version?.file_size)}
      </span>
      {item.created_at && (
        <span className="text-xs text-muted-foreground shrink-0 hidden md:block w-20 text-right" title={item.created_at}>
          {formatRelativeTime(item.created_at)}
        </span>
      )}
    </div>
  )
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

function MediaGallery({
  items,
  viewMode,
  isLoading,
  isFetching,
  isError,
  onRetry,
  onSelect,
  emptyTitle,
  emptyDescription,
  loadError,
}: {
  items: Media[]
  viewMode: ViewMode
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  onRetry: () => void
  onSelect: (item: Media) => void
  emptyTitle: string
  emptyDescription: string
  loadError: string
}) {
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-medium text-destructive">{loadError}</p>
        <Button variant="outline" size="sm" onClick={onRetry} className="hover:cursor-pointer">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (!isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
        <Inbox className="h-8 w-8" />
        <p className="text-sm font-medium">{emptyTitle}</p>
        <p className="text-xs">{emptyDescription}</p>
      </div>
    )
  }

  if (viewMode === "list") {
    return (
      <div className={cn("flex flex-col gap-1.5", isFetching && "opacity-60 pointer-events-none")}>
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))
          : items.map((item) => <MediaRow key={item.id} item={item} onClick={() => onSelect(item)} />)}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4",
        isFetching && "opacity-60 pointer-events-none",
      )}
    >
      {isLoading
        ? Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))
        : items.map((item) => <MediaCard key={item.id} item={item} onClick={() => onSelect(item)} />)}
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
  const [pageSize, setPageSize] = useState(24)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Media | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [viewMode, setViewMode] = useMediaViewMode()

  const filterDefs = useMemo<HuemulFilterDef[]>(() => [
    {
      key: "level",
      type: "select",
      label: t("filters.level"),
      allValue: "organization",
      options: getLevelOptions(t),
    },
    {
      key: "mediaType",
      type: "text",
      label: t("filters.mediaType"),
      placeholder: t("filters.mediaTypePlaceholder"),
    },
  ], [t])

  const {
    values,
    open: filtersOpen,
    setOpen: setFiltersOpen,
    setValue,
    clearValue,
    clearAll,
    chips,
    activeCount,
  } = useHuemulFilters({
    filters: filterDefs,
    defaultOpen: true,
    initialValues: { level: "organization" },
  })

  // Instant-apply: any filter change resets to the first page.
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

  const { data, isLoading, isFetching, isError, refetch } = useMediaList(
    selectedOrganizationId ?? "",
    (values.level as MediaLevel) || "organization",
    {
      enabled: !!selectedOrganizationId,
      page,
      pageSize,
      mediaType: (values.mediaType as string) || undefined,
    },
  )

  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!data,
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: mediaQueryKeys.listBase() })
      await refetch()
      toast.success(t("refreshSuccess"))
    } catch (error) {
      handleApiError(error, { fallbackMessage: t("refreshError") })
    } finally {
      setIsRefreshing(false)
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

  const items = data?.data ?? []

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
                  <MediaGallery
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
                    emptyTitle={t("emptyTitle")}
                    emptyDescription={t("emptyDescription")}
                    loadError={t("loadError")}
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
                      onPageChange={setPage}
                      onPageSizeChange={(size) => {
                        setPageSize(size)
                        setPage(1)
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

    <MediaDetailSheet
      item={selectedItem}
      open={detailOpen}
      onOpenChange={setDetailOpen}
      organizationId={selectedOrganizationId}
    />

    <UploadMediaSheet
      open={uploadOpen}
      onOpenChange={setUploadOpen}
      organizationId={selectedOrganizationId}
    />
  </>
  )
}
