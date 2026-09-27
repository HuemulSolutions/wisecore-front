import type { Edge } from '@xyflow/react'
import type { CanvasNode } from '@/lib/diagram-utils'
import type { RelationshipEdgeData } from '@/components/document-type-relationships/relationship-edge'

// ─── Hook options ─────────────────────────────────────────────────────────────

export interface UseDocumentTypeRelationshipsOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  search?: string
  documentTypeId?: string
  includeSubrelationships?: boolean
}

export interface UseDiagramDirtyStateOptions {
  nodes: CanvasNode[]
  edges: Edge<RelationshipEdgeData>[]
  /** `true` mientras queda un lote de aristas esperando a `useNodesInitialized`. */
  isSeedPending: () => boolean
}

export interface DiagramDirtyState {
  isDirty: boolean
  /** Pide re-estampar la línea base cuando el grafo se estabilice (cargar diagrama, limpiar canvas). */
  requestBaselineReset: () => void
  /** Estampa la línea base con el grafo EXACTO que se persistió. */
  markSaved: (nodes: CanvasNode[], edges: Edge<RelationshipEdgeData>[]) => void
}
