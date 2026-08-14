import type { DocumentType } from '@/types/document-types'
import type { ExecutionRelationshipType, ExecutionRelationshipAttributeValue } from '@/types/execution-relationships'
import type { Diagram } from '@/types/diagrams'
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
// (the backend rejects blank `content`, so a container can't be an empty box), and a
// "role" is a free-floating circle labeled with an RBAC role's name.
export type CanvasElementKind = 'text' | 'container' | 'role'

// An RBAC role assigned to a canvas element (container acting as a lane, or a
// free-standing role node). Stashed inside `DiagramText.position` on save — see
// `buildInitialCanvasElements` / `save-as-diagram-sheet.tsx` — since the backend has
// no first-class role_id column on diagram_texts yet. No `color`: roles have no
// assignable color anywhere in the app (no such field on the role form), so nothing
// here should imply one — the container/node keep using their own element color.
export interface CanvasElementRole {
  id: string
  name: string
}

// A text/container/role element to seed the canvas with on mount, at an explicit saved
// position/size (used to reopen a previously-saved Diagram for editing).
export interface InitialCanvasElement {
  kind: CanvasElementKind
  content: string
  color: string
  position: { x: number; y: number }
  width: number
  height: number
  role?: CanvasElementRole
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
  // Fired after a successful create/update from the "Save as Diagram" sheet, with the
  // resulting Diagram — lets the caller (e.g. NewDiagramCanvas) sync its own state/URL
  // now that the canvas has been promoted into "editing" mode for it.
  onDiagramSaved?: (diagram: Diagram) => void
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
  // Hides the "role" drag item when the user can't list roles (same gate as the
  // toolbar's "Add Role" button and the @role mention picker).
  canPickRole?: boolean
}

export interface AssetTypeDraggableItemProps {
  item: DocumentType
}
