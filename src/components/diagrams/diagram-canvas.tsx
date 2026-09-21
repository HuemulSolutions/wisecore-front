"use client"

import { useTranslation } from "react-i18next"
import { useDiagram } from "@/hooks/useDiagrams"
import { useDocumentTypes } from "@/hooks/useDocumentTypes"
import { isErrorCode } from "@/lib/error-utils"
import { RelationshipsCanvas, CanvasLoadError, CanvasLoadingSkeleton, DOTTED_CANVAS_STYLE } from "@/components/document-type-relationships"
import type { RelationshipsCanvasProps } from "@/types/document-type-relationships"
import { buildInitialCanvasGraph } from "@/lib/diagram-utils"
import { cn } from "@/lib/utils"

type EditorChromeProps = Pick<
  RelationshipsCanvasProps,
  | 'chrome'
  | 'onOpenAssetTree'
  | 'isSearchOpen'
  | 'onSearchOpenChange'
  | 'railFocusRef'
  | 'onRefresh'
  | 'isRefreshing'
  | 'onDiagramSaved'
  | 'onDiagramDeleted'
>

export type DiagramCanvasProps = {
  organizationId: string
  diagramId: string
  readOnly?: boolean
  className?: string
  /** Fired after "Clear canvas" — lets the caller (e.g. the /diagrams page) sync the URL. */
  onCanvasCleared?: () => void
  /** Nombre conocido de antemano (ej. desde "recientes") para el skeleton de carga. */
  fallbackName?: string
  /** Estado de error: lleva al listado de diagramas. */
  onViewDiagrams?: () => void
} & EditorChromeProps

// Loads a saved Diagram and mounts it on RelationshipsCanvas — shared between the
// diagram viewer sheet (readOnly) and the assets page relations mode (editable).
// Relies on react-query's cache: the sheet fetches the same diagram (by the same
// key) for its title/loading UI, so this doesn't cost a second network request.
export function DiagramCanvas({ organizationId, diagramId, readOnly = false, className, onCanvasCleared, fallbackName, onViewDiagrams, ...chromeProps }: DiagramCanvasProps) {
  const { t } = useTranslation(["diagrams", "document-type-relationships"])

  const { data: diagram, isLoading: isLoadingDiagram, error: diagramError, refetch } = useDiagram(organizationId, diagramId)
  const { data: docTypesResponse, isLoading: isLoadingDocTypes } = useDocumentTypes()
  const documentTypes = docTypesResponse?.data ?? []

  const graph = diagram ? buildInitialCanvasGraph(diagram) : undefined

  const hasError = !!diagramError || (!isLoadingDiagram && !diagram)
  const isReady = !!diagram && !!graph && !isLoadingDocTypes

  const isEditorChrome = chromeProps.chrome === 'editor'

  if (hasError) {
    if (isEditorChrome) {
      return (
        <div className={cn("relative h-full", className)} style={DOTTED_CANVAS_STYLE}>
          <CanvasLoadError diagramId={diagramId} onRetry={() => void refetch()} onViewDiagrams={onViewDiagrams} />
        </div>
      )
    }
    return (
      <p className={cn("text-sm text-destructive p-4", className)}>
        {isErrorCode(diagramError, "DIAGRAM_NOT_FOUND") ? t("editSheet.notFound") : t("editSheet.loadingError")}
      </p>
    )
  }

  if (!isReady || !diagram || !graph) {
    if (isEditorChrome) {
      return (
        <div className={cn("relative h-full", className)} style={DOTTED_CANVAS_STYLE}>
          <CanvasLoadingSkeleton name={fallbackName} />
        </div>
      )
    }
    return null
  }

  return (
    <div className={cn("h-full", className)}>
      <RelationshipsCanvas
        key={diagram.id}
        organizationId={organizationId}
        documentTypes={documentTypes}
        mode="execution"
        readOnly={readOnly}
        initialNodes={graph.nodes}
        initialRelationships={graph.relationships}
        initialElements={graph.elements}
        onCanvasCleared={onCanvasCleared}
        {...chromeProps}
        editingDiagram={{
          id: diagram.id,
          name: diagram.name,
          description: diagram.description,
          executionId: diagram.execution_id,
          snapshotMediaId: diagram.snapshot_media_id,
        }}
      />
    </div>
  )
}
