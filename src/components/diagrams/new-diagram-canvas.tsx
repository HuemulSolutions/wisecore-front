"use client"

import { useQuery } from "@tanstack/react-query"
import { useDocumentTypes } from "@/hooks/useDocumentTypes"
import { getDocumentById } from "@/services/assets"
import { getExecutionsByDocumentId } from "@/services/executions"
import { RelationshipsCanvas } from "@/components/document-type-relationships"
import { executionLabel } from "@/components/document-type-relationships/execution-relationship-dialogs"
import type { InitialCanvasNode } from "@/types/document-type-relationships"
import type { Execution } from "@/types/execution"
import { cn } from "@/lib/utils"

export interface NewDiagramCanvasProps {
  organizationId: string
  seedAssetId?: string
  seedExecutionId?: string
  className?: string
}

// Fresh canvas for creating a Diagram from scratch (no editingDiagram → the
// canvas shows "Save as Diagram" instead of "Save changes"). When opened from
// the asset diagrams sheet, seeds the canvas with the asset the user came
// from so they land already relating it instead of an empty board.
export function NewDiagramCanvas({ organizationId, seedAssetId, seedExecutionId, className }: NewDiagramCanvasProps) {
  const { data: docTypesResponse, isLoading: isLoadingDocTypes } = useDocumentTypes()
  const documentTypes = docTypesResponse?.data ?? []

  const { data: seed, isLoading: isLoadingSeed } = useQuery({
    queryKey: ["new-diagram-seed", organizationId, seedAssetId, seedExecutionId],
    queryFn: async () => {
      const [document, executions] = await Promise.all([
        getDocumentById(seedAssetId!, organizationId),
        getExecutionsByDocumentId(seedAssetId!, organizationId),
      ])
      const execution: Execution | undefined =
        executions?.find((e: Execution) => e.id === seedExecutionId) ?? executions?.[0]
      if (!execution) return null

      const node: InitialCanvasNode = {
        assetId: seedAssetId!,
        documentTypeId: document?.document_type?.id,
        executionId: execution.id,
        executionName: executionLabel(execution),
        name: document?.name ?? "",
        color: document?.document_type?.color ?? "#94a3b8",
        position: { x: 0, y: 0 },
      }
      return node
    },
    enabled: !!seedAssetId,
    retry: 0,
  })

  const isReady = !isLoadingDocTypes && (!seedAssetId || !isLoadingSeed)

  if (!isReady) {
    return null
  }

  return (
    <div className={cn("h-full", className)}>
      <RelationshipsCanvas
        organizationId={organizationId}
        documentTypes={documentTypes}
        mode="execution"
        initialNodes={seed ? [seed] : undefined}
      />
    </div>
  )
}
