import type { DocumentType } from '@/types/document-types'
import type React from 'react'

// ─── Canvas ───────────────────────────────────────────────────────────────────

export interface PendingConnection {
  sourceId: string
  targetId: string
  // populated in execution mode: the document type IDs from the node data
  sourceDocumentTypeId?: string
  targetDocumentTypeId?: string
  // display labels
  sourceName?: string
  targetName?: string
  sourceColor?: string
  targetColor?: string
  // actual asset (document) IDs — separate from canvas node IDs in execution mode
  sourceAssetId?: string
  targetAssetId?: string
  // pre-selected execution ids (from node panel version selector)
  sourceExecutionId?: string
  targetExecutionId?: string
}

export interface CanvasNodeAction {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: (nodeId: string) => void
  destructive?: boolean
  separator?: boolean
}

// A node to seed the canvas with on mount, at an explicit saved position
// (used to reopen a previously-saved Diagram for editing).
export interface InitialCanvasNode {
  assetId: string
  documentTypeId?: string
  executionId: string
  executionName: string
  name: string
  color: string
  position: { x: number; y: number }
}

// When present, the canvas is editing an existing Diagram rather than starting a new one:
// the "Save as Diagram" action becomes "Save changes" and updates this diagram instead of
// creating a new one.
export interface EditingDiagram {
  id: string
  name: string
  description?: string | null
  executionId: string
  snapshotMediaId: string | null
}

export interface RelationshipsCanvasProps {
  organizationId: string
  documentTypes: DocumentType[]
  initialDocumentTypeId?: string
  nodeActions?: CanvasNodeAction[]
  mode?: 'document-type' | 'execution'
  initialNodes?: InitialCanvasNode[]
  editingDiagram?: EditingDiagram
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export interface AssetTypeSidebarProps {
  items: DocumentType[]
  isLoading?: boolean
  isFetching?: boolean
  page: number
  pageSize: number
  onRefresh?: () => void
}

export interface AssetTypeDraggableItemProps {
  item: DocumentType
}
