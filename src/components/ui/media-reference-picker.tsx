'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlateEditor } from 'platejs/react'
import { KEYS } from 'platejs'
import { Image, Sparkles } from 'lucide-react'
import { useMediaList } from '@/hooks/useMedia'
import { useMediaFilters } from '@/hooks/useMediaFilters'
import { useMediaViewMode } from '@/hooks/useMediaViewMode'
import { usePageAccess } from '@/hooks/usePageAccess'
import { HuemulSheet } from '@/huemul/components/huemul-sheet'
import { HuemulPagination } from '@/huemul/components/huemul-pagination'
import { DEFAULT_PAGE_SIZE } from '@/huemul/constants'
import { HuemulButton } from '@/huemul/components/huemul-button'
import { HuemulFilterButton } from '@/huemul/components/huemul-filter-button'
import { HuemulFilterChips } from '@/huemul/components/huemul-filter-chips'
import { HuemulFilterPanel } from '@/huemul/components/huemul-filter-panel'
import { HuemulViewToggle } from '@/huemul/components/huemul-view-toggle'
import { HuemulMediaGallery } from '@/huemul/components/huemul-media-gallery'
import { HuemulMediaGenerateSheet } from '@/huemul/components/huemul-media-generate-sheet'
import { mediaTokenFor } from '@/lib/plate-media-utils'
import type { Media } from '@/types/media'
import type { GeneratedImage } from '@/types/image-generation'
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
  const [generateOpen, setGenerateOpen] = useState(false)
  const { can } = usePageAccess('media')
  const canCreate = can('createMedia')
  const canDeleteMedia = can('deleteMedia')

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

  function insertMediaReference(mediaId: string, previewUrl: string) {
    if (!editor) return

    const url = mediaTokenFor(mediaId)

    // Insert image node at current selection
    editor.tf.insertNodes(
      {
        type: KEYS.img,
        url,
        previewUrl,
        mediaId,
        children: [{ text: '' }],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      { select: true },
    )

    // Insert an empty paragraph after so the cursor can continue writing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editor.tf.insertNodes({ type: KEYS.p, children: [{ text: '' }] } as any)
  }

  function handleSelect(media: Media) {
    if (!editor) return
    insertMediaReference(media.id, media.current_version?.download_url || '')
    handleClose()
  }

  function handleGeneratedInsert(image: GeneratedImage) {
    insertMediaReference(image.media_id, image.url)
    setGenerateOpen(false)
    handleClose()
  }

  return (
    <HuemulSheet
      open={open}
      onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true) }}
      title={t('media.mediaReferenceTitle')}
      icon={Image}
      showFooter={false}
      className="w-full sm:max-w-[95vw]"
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4"
    >
      {/* Toolbar: filter button + view toggle (same filters as the Media page) */}
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <HuemulFilterButton
          count={activeCount}
          open={filtersOpen}
          onToggle={() => setFiltersOpen(!filtersOpen)}
        />
        <div className="flex-1" />
        {canCreate && (
          <HuemulButton
            variant="outline"
            size="sm"
            icon={Sparkles}
            iconClassName="w-3 h-3 mr-1"
            label={tMedia('generate.button')}
            onClick={() => setGenerateOpen(true)}
            className="h-8 text-xs px-2"
          />
        )}
        <HuemulViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {/* Body: optional filter panel + results */}
      <div className="flex flex-1 min-h-0 gap-4">
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

      <HuemulMediaGenerateSheet
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        organizationId={organizationId}
        canCreate={canCreate}
        canDelete={canDeleteMedia}
        onInsert={handleGeneratedInsert}
      />
    </HuemulSheet>
  )
}
