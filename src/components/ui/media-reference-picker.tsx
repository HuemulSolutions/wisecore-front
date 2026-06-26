'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlateEditor } from 'platejs/react'
import { KEYS } from 'platejs'
import { Image, File, Film, Music, Archive, FileText, Search } from 'lucide-react'
import { useMediaPicker } from '@/hooks/useMedia'
import { useHuemulFilters } from '@/hooks/useHuemulFilters'
import { useMediaViewMode } from '@/hooks/useMediaViewMode'
import { HuemulDialog } from '@/huemul/components/huemul-dialog'
import { HuemulPagination } from '@/huemul/components/huemul-pagination'
import { HuemulFilterButton } from '@/huemul/components/huemul-filter-button'
import { HuemulFilterChips } from '@/huemul/components/huemul-filter-chips'
import { HuemulFilterPanel } from '@/huemul/components/huemul-filter-panel'
import { HuemulViewToggle } from '@/huemul/components/huemul-view-toggle'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatBytes } from '@/lib/format-bytes'
import type { Media } from '@/types/media'
import type { HuemulFilterDef, HuemulFilterValue } from '@/types/huemul'

const PAGE_SIZE = 20

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp'])

function isImage(contentType?: string | null): boolean {
  return !!contentType && IMAGE_TYPES.has(contentType.toLowerCase())
}

function MediaThumb({ media }: { media: Media }) {
  const version = media.current_version
  const contentType = version?.content_type

  if (isImage(contentType) && version?.download_url) {
    return (
      <img
        src={version.download_url}
        alt={media.name || version.original_filename}
        className="w-full h-full object-cover"
        onError={(e) => {
          const el = e.target as HTMLImageElement
          el.style.display = 'none'
        }}
      />
    )
  }

  const cls = 'h-8 w-8 text-muted-foreground'
  if (contentType?.startsWith('video/')) return <Film className={cls} />
  if (contentType?.startsWith('audio/')) return <Music className={cls} />
  if (contentType?.includes('pdf') || contentType?.startsWith('text/')) return <FileText className={cls} />
  if (contentType?.includes('zip') || contentType?.includes('tar')) return <Archive className={cls} />
  return <File className={cls} />
}

function MediaPickerCard({ media, onSelect }: { media: Media; onSelect: (m: Media) => void }) {
  const contentType = media.current_version?.content_type
  return (
    <button
      type="button"
      className={cn(
        'group flex flex-col gap-1.5 rounded-lg border bg-card p-1.5 text-left',
        'hover:cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors',
      )}
      onClick={() => onSelect(media)}
    >
      <div className="aspect-square w-full rounded-md bg-muted flex items-center justify-center overflow-hidden">
        <MediaThumb media={media} />
      </div>
      <div className="px-0.5">
        <p className="text-[11px] font-medium truncate leading-tight">
          {media.name || media.current_version?.original_filename || media.id}
        </p>
        {contentType && (
          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 mt-0.5 leading-none">
            {contentType.split('/')[1]?.toUpperCase()}
          </Badge>
        )}
      </div>
    </button>
  )
}

function MediaPickerRow({ media, onSelect }: { media: Media; onSelect: (m: Media) => void }) {
  const version = media.current_version
  const contentType = version?.content_type
  const name = media.name || version?.original_filename || media.id

  return (
    <button
      type="button"
      className={cn(
        'group flex items-center gap-3 rounded-lg border bg-card px-3 py-2 text-left w-full',
        'hover:cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors',
      )}
      onClick={() => onSelect(media)}
    >
      <div className="h-9 w-9 shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden">
        <MediaThumb media={media} />
      </div>
      <p className="flex-1 min-w-0 truncate text-sm font-medium" title={name}>
        {name}
      </p>
      {contentType && (
        <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 h-5 shrink-0">
          {contentType.split('/')[1]?.toUpperCase() ?? contentType}
        </Badge>
      )}
      <span className="text-xs text-muted-foreground shrink-0 w-16 text-right tabular-nums">
        {formatBytes(version?.file_size)}
      </span>
    </button>
  )
}

interface MediaReferencePickerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  editor: PlateEditor | null
  organizationId: string
  documentId: string
}

export function MediaReferencePicker({
  open,
  onOpenChange,
  editor,
  organizationId,
  documentId,
}: MediaReferencePickerProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { t } = useTranslation('editor')
  const [viewMode, setViewMode] = useMediaViewMode()

  const filterDefs = useMemo<HuemulFilterDef[]>(() => [
    {
      key: 'mediaType',
      type: 'text',
      label: t('media.fileType'),
      placeholder: t('media.fileTypePlaceholder'),
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
  } = useHuemulFilters({ filters: filterDefs, defaultOpen: false })

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

  // Reset page to 1 when search changes
  useEffect(() => {
    setPage(1)
  }, [search])

  const isSearching = search.trim().length > 0

  const { data, isLoading } = useMediaPicker(organizationId, documentId, {
    enabled: open && !!organizationId,
    page,
    pageSize: PAGE_SIZE,
    mediaType: (values.mediaType as string) || undefined,
  })

  const items = data?.data ?? []
  const hasNext = data?.has_next ?? false
  const hasPrev = page > 1

  const filtered = isSearching
    ? items.filter((m) => {
        const name = (m.name || m.current_version?.original_filename || '').toLowerCase()
        return name.includes(search.toLowerCase())
      })
    : items

  function handleClose() {
    onOpenChange(false)
    setSearch('')
    setPage(1)
  }

  function handleSelect(media: Media) {
    if (!editor) return

    const version = media.current_version
    const url = `{{MEDIA:${media.id}}}`
    const previewUrl = version?.download_url || ''

    // Insert image node at current selection
    editor.tf.insertNodes(
      {
        type: KEYS.img,
        url,
        previewUrl,
        mediaId: media.id,
        children: [{ text: '' }],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      { select: true },
    )

    // Insert an empty paragraph after so the cursor can continue writing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editor.tf.insertNodes({ type: KEYS.p, children: [{ text: '' }] } as any)

    handleClose()
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true) }}
      title={t('media.mediaReferenceTitle')}
      icon={Image}
      showFooter={false}
      maxWidth="sm:max-w-5xl"
      maxHeight="max-h-[90vh]"
    >
      {/* Toolbar: search + filter button + view toggle */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder={t('media.mediaReferenceSearch')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <HuemulFilterButton
          count={activeCount}
          open={filtersOpen}
          onToggle={() => setFiltersOpen(!filtersOpen)}
        />
        <HuemulViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {/* Body: optional filter panel + results */}
      <div className="flex gap-4 h-[460px]">
        {filtersOpen && (
          <div className="w-56 shrink-0 rounded-lg border overflow-hidden">
            <HuemulFilterPanel
              filters={filterDefs}
              values={values}
              onChange={handleFilterChange}
              onClose={() => setFiltersOpen(false)}
            />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <HuemulFilterChips chips={chips} onRemove={handleChipRemove} onClearAll={handleClearAll} />

          {isLoading ? (
            viewMode === 'list' ? (
              <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto py-1 pr-1">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <div key={i} className="h-[52px] rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-3 flex-1 overflow-y-auto py-1 pr-1">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            )
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-2 text-muted-foreground">
              <File className="h-8 w-8" />
              <p className="text-sm">{isSearching ? t('media.mediaReferenceEmpty') : t('media.mediaReferenceNoItems')}</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto py-1 pr-1">
              {filtered.map((media) => (
                <MediaPickerRow key={media.id} media={media} onSelect={handleSelect} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-3 flex-1 overflow-y-auto py-1 pr-1">
              {filtered.map((media) => (
                <MediaPickerCard key={media.id} media={media} onSelect={handleSelect} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isSearching && (hasPrev || hasNext) && (
            <HuemulPagination
              page={page}
              pageSize={PAGE_SIZE}
              hasNext={hasNext}
              hasPrevious={hasPrev}
              onPageChange={setPage}
            />
          )}

          {/* Search scope hint */}
          {isSearching && items.length > 0 && (
            <p className="text-[11px] text-muted-foreground text-right">
              {t('media.searchingInPage')}
            </p>
          )}
        </div>
      </div>
    </HuemulDialog>
  )
}
