import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Download, Loader2, Upload, UploadCloud, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { HuemulButton } from "./huemul-button"
import { isImage, MediaIcon } from "./huemul-media-icon"
import type { MediaVersion } from "@/types/media"

export interface MediaPreviewPaneProps {
  version: MediaVersion | null
  name: string
  nextVersionNumber: number
  uploading: boolean
  sheetOpen: boolean
  /**
   * Permite subir una versión nueva (`media:c`). Obligatoria a propósito: soltar
   * un archivo en el lienzo dispara la mutación sin pasar por ningún botón, así
   * que ocultar el botón no alcanza (ver punto 8 de rbac-audit-guide.md).
   */
  canUpload: boolean
  onDownload: () => void
  onPickFile: () => void
  onFileDropped: (file: File) => void
}

export function MediaPreviewPane({
  version,
  name,
  nextVersionNumber,
  uploading,
  sheetOpen,
  canUpload,
  onDownload,
  onPickFile,
  onFileDropped,
}: MediaPreviewPaneProps) {
  const { t } = useTranslation("media")
  const { t: tCommon } = useTranslation("common")
  const [isDragOver, setIsDragOver] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Cierra el fullscreen si el sheet se cierra sin desmontar este panel
  useEffect(() => {
    if (!sheetOpen) setIsFullscreen(false)
  }, [sheetOpen])

  const showImage = isImage(version?.content_type) && !!version?.download_url

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (uploading || !canUpload) return
    if (!e.dataTransfer.types.includes("Files")) return
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    setIsDragOver(true)
  }, [uploading, canUpload])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (uploading || !canUpload) return
    const file = e.dataTransfer.files?.[0]
    if (file) onFileDropped(file)
  }, [uploading, canUpload, onFileDropped])

  return (
    <section
      className={cn(
        "relative flex min-h-80 min-w-0 flex-1 flex-col bg-muted/40 transition-colors lg:min-h-0",
        isDragOver && "bg-primary/5",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {version && (
        <Badge
          variant="secondary"
          className="absolute top-4 left-4 z-10 h-5 border bg-background/90 px-2 text-[10px] font-medium backdrop-blur-sm"
        >
          {t("detail.currentVersionBadge", { version: version.version_number })}
        </Badge>
      )}

      <div className="flex min-h-0 flex-1 items-center justify-center p-6 lg:p-8">
        {showImage ? (
          <img
            src={version!.download_url}
            alt={name}
            role="button"
            aria-label={t("detail.expand")}
            className="max-h-full max-w-full cursor-zoom-in rounded-xl border bg-card object-contain shadow-sm transition-transform hover:scale-[1.01]"
            onClick={() => setIsFullscreen(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 px-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-dashed bg-background/60">
              <MediaIcon contentType={version?.content_type} className="size-6 opacity-50" />
            </div>
            {version?.original_filename && (
              <p className="text-xs text-muted-foreground">{version.original_filename}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-center gap-2 border-t bg-background/70 px-6 py-3">
        <HuemulButton
          variant="outline"
          size="sm"
          icon={Download}
          label={t("detail.download")}
          disabled={!version}
          onClick={onDownload}
        />
        {canUpload && (
          <HuemulButton
            variant="outline"
            size="sm"
            icon={Upload}
            label={t("detail.uploadVersion")}
            loading={uploading}
            onClick={onPickFile}
          />
        )}
      </div>

      {canUpload && isDragOver && (
        <div className="pointer-events-none absolute inset-3 z-20 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary bg-background/85 px-8 text-center backdrop-blur-sm">
          <UploadCloud className="size-8 text-primary" />
          <p className="text-sm font-medium text-primary">
            {t("detail.dropTitle", { version: nextVersionNumber })}
          </p>
          <p className="text-xs text-muted-foreground">{t("detail.dropHint")}</p>
        </div>
      )}

      {uploading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-sm">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">{t("detail.uploadingVersion")}</p>
        </div>
      )}

      {showImage && (
        <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
          <DialogContent
            showCloseButton={false}
            className="top-0 left-0 flex h-screen w-screen max-w-none translate-x-0 translate-y-0 items-center justify-center gap-0 rounded-none border-0 bg-black/95 p-0 sm:max-w-none"
          >
            <DialogTitle className="sr-only">{name}</DialogTitle>
            <img
              src={version!.download_url}
              alt={name}
              className="max-h-[95vh] max-w-[95vw] object-contain"
            />
            <button
              type="button"
              aria-label={tCommon("close")}
              onClick={() => setIsFullscreen(false)}
              className="fixed top-4 right-4 rounded-full bg-black/50 p-2 text-white transition-opacity hover:opacity-80"
            >
              <X className="size-5" />
            </button>
          </DialogContent>
        </Dialog>
      )}
    </section>
  )
}
