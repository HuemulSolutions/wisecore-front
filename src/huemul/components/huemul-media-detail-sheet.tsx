import { useState, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Image, Download, History, Clock, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import { formatAbsoluteDate } from "@/lib/format-relative-time"

import { useMediaVersions, useMediaMutations } from "@/hooks/useMedia"
import { handleApiError } from "@/lib/error-utils"
import { HuemulSheet } from "./huemul-sheet"
import { HuemulAlertDialog } from "./huemul-alert-dialog"
import { HuemulInfoDisplay, HuemulInfoGroup, HuemulInfoItem } from "./huemul-info-display"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { formatBytes } from "@/lib/format-bytes"
import { isImage, MediaIcon, IMAGE_TYPES, IMAGE_ACCEPT } from "./huemul-media-icon"
import type { Media, MediaVersion } from "@/types/media"

// ─── Version card ─────────────────────────────────────────────────────────────

function VersionCard({
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
      "flex flex-col rounded-lg border overflow-hidden bg-card",
      isCurrent && "border-primary/40",
    )}>
      {/* Thumbnail */}
      <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {isImage(version.content_type) && version.download_url ? (
          <img
            src={version.download_url}
            alt={version.original_filename}
            className="object-cover w-full h-full"
            loading="lazy"
          />
        ) : (
          <MediaIcon contentType={version.content_type} className="h-10 w-10 opacity-40" />
        )}
        <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
          v{version.version_number}
        </span>
        {isCurrent && (
          <Badge variant="default" className="absolute top-1.5 left-1.5 text-[9px] px-1 py-0 h-3.5 leading-none">
            {t("detail.current")}
          </Badge>
        )}
      </div>

      {/* Info + actions */}
      <div className="flex items-center justify-between gap-1 p-2">
        <div className="min-w-0 space-y-0.5">
          <p className="text-[11px] font-medium text-foreground">{formatBytes(version.file_size)}</p>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate" title={version.created_at}>{formatAbsoluteDate(version.created_at)}</span>
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
    </div>
  )
}

// ─── Media detail sheet ───────────────────────────────────────────────────────

export interface HuemulMediaDetailSheetProps {
  item: Media | null
  open: boolean
  onOpenChange: (v: boolean) => void
  organizationId: string
  /** When false, hides the danger zone (delete media). Defaults to true. */
  canDelete?: boolean
}

export function HuemulMediaDetailSheet({
  item,
  open,
  onOpenChange,
  organizationId,
  canDelete = true,
}: HuemulMediaDetailSheetProps) {
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
        maxWidth="sm:max-w-2xl"
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-[3/4] w-full rounded-lg" />
                  ))}
                </div>
              ) : versions.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">{t("detail.noVersions")}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[...versions]
                    .sort((a, b) => b.version_number - a.version_number)
                    .map((v) => (
                      <VersionCard
                        key={v.id}
                        version={v}
                        isCurrent={v.is_current}
                        onDelete={() => setDeleteVersionTarget(v)}
                      />
                    ))}
                </div>
              )}
            </div>

            {/* Danger zone */}
            {canDelete && (
              <>
                <Separator />
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
              </>
            )}
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
