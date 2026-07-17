"use client"

import { useTranslation } from "react-i18next"
import { Workflow } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { useDiagram } from "@/hooks/useDiagrams"
import { useDocumentTypes } from "@/hooks/useDocumentTypes"
import { isErrorCode } from "@/lib/error-utils"
import { RelationshipsCanvas } from "@/components/document-type-relationships"
import { buildInitialCanvasNodes } from "@/lib/diagram-utils"

export interface DiagramEditSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  diagramId: string | null
  organizationId: string
}

export function DiagramEditSheet({
  open,
  onOpenChange,
  diagramId,
  organizationId,
}: DiagramEditSheetProps) {
  const { t } = useTranslation(['diagrams', 'document-type-relationships'])

  const { data: diagram, isLoading: isLoadingDiagram, error: diagramError } = useDiagram(
    organizationId,
    diagramId ?? '',
  )
  const { data: docTypesResponse, isLoading: isLoadingDocTypes } = useDocumentTypes()
  const documentTypes = docTypesResponse?.data ?? []

  const initialNodes = diagram ? buildInitialCanvasNodes(diagram) : undefined

  const hasError = !!diagramError || (!isLoadingDiagram && !diagram)
  const isReady = !!diagram && !!initialNodes && !isLoadingDocTypes

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={diagram?.name ?? t('editSheet.title')}
      icon={Workflow}
      showFooter={false}
      maxWidth="sm:max-w-[95vw]"
      bodyLoading={!isReady && !hasError}
    >
      {hasError ? (
        <p className="text-sm text-destructive">
          {isErrorCode(diagramError, 'DIAGRAM_NOT_FOUND') ? t('editSheet.notFound') : t('editSheet.loadingError')}
        </p>
      ) : isReady && diagram ? (
        <div className="h-[80vh]">
          <RelationshipsCanvas
            key={diagram.id}
            organizationId={organizationId}
            documentTypes={documentTypes}
            mode="execution"
            initialNodes={initialNodes}
            initialRelationships={diagram.relationships}
            editingDiagram={{
              id: diagram.id,
              name: diagram.name,
              description: diagram.description,
              executionId: diagram.execution_id,
              snapshotMediaId: diagram.snapshot_media_id,
            }}
          />
        </div>
      ) : null}
    </HuemulSheet>
  )
}
