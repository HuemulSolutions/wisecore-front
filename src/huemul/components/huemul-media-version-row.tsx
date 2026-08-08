import { useTranslation } from "react-i18next"
import { Download, Trash2 } from "lucide-react"

import { formatAbsoluteDate } from "@/lib/format-relative-time"
import { formatBytes } from "@/lib/format-bytes"
import { cn } from "@/lib/utils"
import { HuemulButton } from "./huemul-button"
import { Badge } from "@/components/ui/badge"
import { isImage, MediaIcon } from "./huemul-media-icon"
import type { MediaVersion } from "@/types/media"

// ─── Helpers ────────────────────────────────────────────────────────────────

export function downloadVersion(version: MediaVersion | null | undefined) {
  if (!version) return
  const a = document.createElement("a")
  a.href = version.download_url
  a.download = version.original_filename
  a.target = "_blank"
  a.rel = "noopener noreferrer"
  a.click()
}

// ─── Version row ──────────────────────────────────────────────────────────

export interface MediaVersionRowProps {
  version: MediaVersion
  isCurrent: boolean
  onDelete: () => void
}

export function MediaVersionRow({ version, isCurrent, onDelete }: MediaVersionRowProps) {
  const { t } = useTranslation("media")

  return (
    <div className={cn(
      "group flex items-center gap-2.5 rounded-lg border bg-card px-2.5 py-2 transition-colors",
      isCurrent && "border-primary/40 bg-primary/5",
    )}>
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center">
        {isImage(version.content_type) && version.download_url ? (
          <img
            src={version.download_url}
            alt={version.original_filename}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <MediaIcon contentType={version.content_type} className="h-4 w-4 opacity-50" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-medium tabular-nums">v{version.version_number}</span>
          {isCurrent && (
            <Badge variant="default" className="h-4 px-1 text-[9px] leading-none">
              {t("detail.current")}
            </Badge>
          )}
        </div>
        <p className="truncate text-[11px] text-muted-foreground" title={version.created_at}>
          {formatAbsoluteDate(version.created_at)} · {formatBytes(version.file_size)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <HuemulButton
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:cursor-pointer"
          icon={Download}
          tooltip={t("detail.download")}
          onClick={() => downloadVersion(version)}
        />
        <HuemulButton
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:cursor-pointer text-muted-foreground hover:text-destructive"
          icon={Trash2}
          tooltip={t("detail.deleteVersion")}
          onClick={onDelete}
        />
      </div>
    </div>
  )
}
