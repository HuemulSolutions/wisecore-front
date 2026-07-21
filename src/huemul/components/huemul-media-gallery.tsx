import { AlertCircle, RefreshCw, Inbox } from "lucide-react"
import { formatRelativeTime } from "@/lib/format-relative-time"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatBytes } from "@/lib/format-bytes"
import { isImage, MediaIcon } from "./huemul-media-icon"
import type { Media } from "@/types/media"
import type { ViewMode } from "./huemul-view-toggle"

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

export interface HuemulMediaGalleryProps {
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
  retryLabel?: string
}

export function HuemulMediaGallery({
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
  retryLabel = "Retry",
}: HuemulMediaGalleryProps) {
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-medium text-destructive">{loadError}</p>
        <Button variant="outline" size="sm" onClick={onRetry} className="hover:cursor-pointer">
          <RefreshCw className="h-4 w-4 mr-2" />
          {retryLabel}
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
