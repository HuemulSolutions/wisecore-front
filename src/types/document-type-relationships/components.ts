import type { DocumentType } from '@/types/document-types'
import type { ExecutionRelationshipType, ExecutionRelationshipAttributeValue } from '@/types/execution-relationships'
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

// A saved Diagram relationship, already resolved by the backend — the shape the
// canvas needs to draw an edge without re-fetching execution relationships per node.
export interface InitialCanvasRelationship {
  execution_relationship_id: string
  relationship_type: ExecutionRelationshipType
  execution_relationship_name: string | null
  source_execution_id: string
  target_execution_id: string
  document_type_relationship: { id: string; name: string; min_count: number; max_count: number } | null
  attributes: ExecutionRelationshipAttributeValue[]
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

// Free-standing canvas decorations — not tied to an asset. Persisted as Diagram `texts`:
// a "text" has no border, a "container" is a bordered box whose `content` is its title
// (the backend rejects blank `content`, so a container can't be an empty box).
export type CanvasElementKind = 'text' | 'container'

// A text/container element to seed the canvas with on mount, at an explicit saved
// position/size (used to reopen a previously-saved Diagram for editing).
export interface InitialCanvasElement {
  kind: CanvasElementKind
  content: string
  color: string
  position: { x: number; y: number }
  width: number
  height: number
}

export interface RelationshipsCanvasProps {
  organizationId: string
  documentTypes: DocumentType[]
  initialDocumentTypeId?: string
  nodeActions?: CanvasNodeAction[]
  mode?: 'document-type' | 'execution'
  initialNodes?: InitialCanvasNode[]
  // Saved relationships to draw as edges between `initialNodes` (already resolved by the backend).
  initialRelationships?: InitialCanvasRelationship[]
  // Saved text/container elements to seed the canvas with on mount.
  initialElements?: InitialCanvasElement[]
  editingDiagram?: EditingDiagram
  // View-only mode: no dragging, connecting, resizing, inline editing, or toolbars —
  // just pan/zoom and the informational side panels. Used by the diagram viewer sheet;
  // real editing happens back on the assets page in relations mode.
  readOnly?: boolean
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
