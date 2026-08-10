'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlateEditor } from 'platejs/react'
import { KEYS } from 'platejs'
import { Image } from 'lucide-react'
import { useMediaList } from '@/hooks/useMedia'
import { useMediaFilters } from '@/hooks/useMediaFilters'
import { useMediaViewMode } from '@/hooks/useMediaViewMode'
import { HuemulDialog } from '@/huemul/components/huemul-dialog'
import { HuemulPagination } from '@/huemul/components/huemul-pagination'
import { DEFAULT_PAGE_SIZE } from '@/huemul/constants'
import { HuemulFilterButton } from '@/huemul/components/huemul-filter-button'
import { HuemulFilterChips } from '@/huemul/components/huemul-filter-chips'
import { HuemulFilterPanel } from '@/huemul/components/huemul-filter-panel'
import { HuemulViewToggle } from '@/huemul/components/huemul-view-toggle'
import { HuemulMediaGallery } from '@/huemul/components/huemul-media-gallery'
import type { Media } from '@/types/media'
import type { EditorMediaUploadTarget } from '@/contexts/media-reference-context'

const PAGE_SIZE = DEFAULT_PAGE_SIZE

interface MediaReferencePickerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  editor: PlateEditor | null
  organizationId: string
  documentId: string
  /** Default filter scope (the editor's context). Falls back to the document. */
  uploadTarget?: EditorMediaUploadTarget | null
}

export function MediaReferencePicker({
  open,
  onOpenChange,
  editor,
  organizationId,
  documentId,
  uploadTarget,
}: MediaReferencePickerProps) {
  const { t } = useTranslation('editor')
  const { t: tMedia } = useTranslation('media')
  const { t: tCommon } = useTranslation('common')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useMediaViewMode()

  // Default the picker scope to the editor context (asset / version); fall back to
  // the document, then organization.
  const defaultTarget = uploadTarget ?? (documentId ? { level: 'document' as const, parentId: documentId } : null)

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
    onFilterChange,
    onChipRemove,
    onClearAll,
    onSelectedLabel,
  } = useMediaFilters({
    initialLevel: defaultTarget?.level ?? 'organization',
    initialParentId: defaultTarget?.parentId,
    initialParentLabel: defaultTarget
      ? tMedia(defaultTarget.level === 'execution' ? 'picker.currentVersion' : 'picker.currentAsset')
      : undefined,
    onChange: () => setPage(1),
  })

  const { data, isLoading, isFetching, isError, refetch } = useMediaList(organizationId, level, {
    enabled: open && !!organizationId && (level === 'organization' || !!parentId),
    page,
    pageSize: PAGE_SIZE,
    mediaType,
    parentId,
  })

  const items = data?.data ?? []

  function handleClose() {
    onOpenChange(false)
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
      {/* Toolbar: filter button + view toggle (same filters as the Media page) */}
      <div className="flex items-center gap-2 mb-4">
        <HuemulFilterButton
          count={activeCount}
          open={filtersOpen}
          onToggle={() => setFiltersOpen(!filtersOpen)}
        />
        <div className="flex-1" />
        <HuemulViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {/* Body: optional filter panel + results */}
      <div className="flex gap-4 h-115">
        {filtersOpen && (
          <div className="w-64 shrink-0 rounded-lg border overflow-hidden">
            <HuemulFilterPanel
              filters={filterDefs}
              values={values}
              onChange={onFilterChange}
              onSelectedLabel={onSelectedLabel}
              onClose={() => setFiltersOpen(false)}
            />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <HuemulFilterChips chips={chips} onRemove={onChipRemove} onClearAll={onClearAll} />

          <div className="flex-1 min-h-0 overflow-y-auto py-1 pr-1">
            <HuemulMediaGallery
              items={items}
              viewMode={viewMode}
              isLoading={isLoading}
              isFetching={isFetching}
              isError={isError}
              onRetry={() => refetch()}
              onSelect={handleSelect}
              emptyTitle={needsParent ? tMedia('emptySelectParentTitle') : tMedia('emptyTitle')}
              emptyDescription={needsParent ? tMedia('emptySelectParentDescription') : tMedia('emptyDescription')}
              loadError={tMedia('loadError')}
              retryLabel={tCommon('tryAgain')}
            />
          </div>

          {(items.length > 0 || page > 1) && (
            <HuemulPagination
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={data?.total}
              hasNext={data?.has_next}
              hasPrevious={page > 1}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>
    </HuemulDialog>
  )
}
