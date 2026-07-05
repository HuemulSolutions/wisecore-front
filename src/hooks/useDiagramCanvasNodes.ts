import { useMemo } from "react"
import { useQueries } from "@tanstack/react-query"
import { getDocumentById } from "@/services/assets"
import { getExecutionById } from "@/services/executions"
import type { Diagram } from "@/types/diagrams"
import type { InitialCanvasNode } from "@/types/document-type-relationships"

// Resolves a Diagram's `details` (execution_id/document_id/position) into the
// document-type name/color/executionName needed to seed a RelationshipsCanvas.
export function useDiagramCanvasNodes(
  organizationId: string,
  diagram: Diagram | undefined,
  enabled: boolean,
) {
  const uniqueDocumentIds = useMemo(
    () => Array.from(new Set((diagram?.details ?? []).map((d) => d.document_id))),
    [diagram],
  )
  const uniqueExecutionIds = useMemo(
    () => Array.from(new Set((diagram?.details ?? []).map((d) => d.execution_id))),
    [diagram],
  )

  const documentQueries = useQueries({
    queries: uniqueDocumentIds.map((documentId) => ({
      queryKey: ['diagram-canvas-nodes-document', organizationId, documentId],
      queryFn: () => getDocumentById(documentId, organizationId),
      enabled: enabled && !!organizationId && !!documentId,
    })),
  })
  const executionQueries = useQueries({
    queries: uniqueExecutionIds.map((executionId) => ({
      queryKey: ['diagram-canvas-nodes-execution', organizationId, executionId],
      queryFn: () => getExecutionById(executionId, organizationId),
      enabled: enabled && !!organizationId && !!executionId,
    })),
  })

  const documentById = useMemo(() => {
    const map = new Map<string, { document_type?: { id: string; name: string; color: string } }>()
    uniqueDocumentIds.forEach((id, i) => {
      const data = documentQueries[i]?.data
      if (data) map.set(id, data)
    })
    return map
  }, [uniqueDocumentIds, documentQueries])

  const executionById = useMemo(() => {
    const map = new Map<string, { name?: string }>()
    uniqueExecutionIds.forEach((id, i) => {
      const data = executionQueries[i]?.data
      if (data) map.set(id, data)
    })
    return map
  }, [uniqueExecutionIds, executionQueries])

  const isLoadingLookups =
    documentQueries.some((q) => q.isLoading) || executionQueries.some((q) => q.isLoading)

  const initialNodes: InitialCanvasNode[] | undefined = useMemo(() => {
    if (!diagram) return undefined
    if (uniqueDocumentIds.some((id) => !documentById.has(id))) return undefined
    if (uniqueExecutionIds.some((id) => !executionById.has(id))) return undefined
    return diagram.details.map((detail) => {
      const doc = documentById.get(detail.document_id)
      const execution = executionById.get(detail.execution_id)
      const position = detail.position as { x?: number; y?: number }
      return {
        assetId: detail.document_id,
        documentTypeId: doc?.document_type?.id,
        executionId: detail.execution_id,
        executionName: execution?.name ?? '',
        name: doc?.document_type?.name ?? '',
        color: doc?.document_type?.color ?? '#94a3b8',
        position: { x: Number(position?.x ?? 0), y: Number(position?.y ?? 0) },
      }
    })
  }, [diagram, uniqueDocumentIds, uniqueExecutionIds, documentById, executionById])

  return { initialNodes, isLoading: isLoadingLookups }
}
