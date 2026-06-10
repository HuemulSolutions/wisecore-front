'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlateEditor } from 'platejs/react'
import { KEYS } from 'platejs'
import { Image, File, Film, Music, Archive, FileText, Search } from 'lucide-react'
import { useMediaPicker } from '@/hooks/useMedia'
import { HuemulDialog } from '@/huemul/components/huemul-dialog'
import { HuemulPagination } from '@/huemul/components/huemul-pagination'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Media } from '@/types/media'

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

  // Reset page to 1 when search changes
  useEffect(() => {
    setPage(1)
  }, [search])

  const isSearching = search.trim().length > 0

  const { data, isLoading } = useMediaPicker(organizationId, documentId, {
    enabled: open && !!organizationId,
    page,
    pageSize: PAGE_SIZE,
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
      } as any,
      { select: true },
    )

    // Insert an empty paragraph after so the cursor can continue writing
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
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder={t('media.mediaReferenceSearch')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-3 h-[460px] py-2">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[460px] gap-2 text-muted-foreground">
          <File className="h-8 w-8" />
          <p className="text-sm">{isSearching ? t('media.mediaReferenceEmpty') : t('media.mediaReferenceNoItems')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-3 h-[460px] overflow-y-auto py-2 pr-1">
          {filtered.map((media) => (
            <button
              key={media.id}
              type="button"
              className={cn(
                'group flex flex-col gap-1.5 rounded-lg border bg-card p-1.5 text-left',
                'hover:cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors',
              )}
              onClick={() => handleSelect(media)}
            >
              <div className="aspect-square w-full rounded-md bg-muted flex items-center justify-center overflow-hidden">
                <MediaThumb media={media} />
              </div>
              <div className="px-0.5">
                <p className="text-[11px] font-medium truncate leading-tight">
                  {media.name || media.current_version?.original_filename || media.id}
                </p>
                {media.current_version?.content_type && (
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 mt-0.5 leading-none">
                    {media.current_version.content_type.split('/')[1]?.toUpperCase()}
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isSearching && (hasPrev || hasNext) && (
        <div className="mt-4">
          <HuemulPagination
            page={page}
            pageSize={PAGE_SIZE}
            hasNext={hasNext}
            hasPrevious={hasPrev}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Search scope hint */}
      {isSearching && items.length > 0 && (
        <p className="text-[11px] text-muted-foreground text-right pt-2">
          {t('media.searchingInPage')}
        </p>
      )}
    </HuemulDialog>
  )
}
