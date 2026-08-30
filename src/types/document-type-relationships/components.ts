import type { DocumentType } from '@/types/document-types'
import type { Diagram, DiagramFlowNodeType, DiagramRelationshipDetail } from '@/types/diagrams'
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

// A node to seed the canvas with on mount, at an explicit saved position (used to
// reopen a previously-saved Diagram for editing). Discriminated by `nodeType` rather
// than a separate `initialRoleNodes` prop: the canvas' edge-seeding batch
// (`pendingEdgeSeedRef`) is a single slot flushed once via `useNodesInitialized` — two
// separate seed calls would have the second overwrite the first and drop edges.
export type InitialCanvasNode = InitialCanvasAssetNode | InitialCanvasRoleNode | InitialCanvasFlowNode

// Canvas `type` for a gateway/start_event/end_event node — distinct from the
// backend's `DiagramFlowNodeType` naming (snake_case) because these double as
// React Flow node type keys, which follow the rest of this canvas's camelCase
// (`assetType`, not `asset_type`).
export type FlowCanvasNodeType = 'gateway' | 'startEvent' | 'endEvent'

export interface InitialCanvasAssetNode {
  nodeType: 'execution'
  assetId: string
  documentTypeId?: string
  executionId: string
  executionName: string
  name: string
  color: string
  position: { x: number; y: number }
}

export interface InitialCanvasRoleNode {
  nodeType: 'role'
  role: CanvasElementRole
  position: { x: number; y: number }
  // Only set when migrating a legacy role stashed in `texts` (carries its old
  // font_color forward) — a first-class role detail has no color of its own.
  color?: string
}

// A gateway/start_event/end_event node to seed the canvas with — no backing
// entity, just a label. `detailId` (the backend detail's real `id`) is what lets
// `seedRelationshipEdges` resolve a saved relationship's `source`/`target` back to
// this specific canvas node: two diamonds are otherwise indistinguishable.
export interface InitialCanvasFlowNode {
  nodeType: 'flow'
  flowType: DiagramFlowNodeType
  detailId: string
  label: string
  position: { x: number; y: number }
}

// A saved Diagram relationship, already resolved by the backend — the shape the
// canvas needs to draw an edge without re-fetching execution relationships per node.
// Aliased straight from the API type: keeping a hand-rolled duplicate here is exactly
// what drifted out of sync with the backend contract before this change.
export type InitialCanvasRelationship = DiagramRelationshipDetail

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

// An RBAC role assigned to a canvas element. On a container (acting as a lane) it's
// stashed inside `DiagramText.position` on save — see `buildDiagramGraphPayload` /
// `save-as-diagram-sheet.tsx` — since the backend has no first-class role_id column on
// diagram_texts yet; that part is unchanged. On a free-standing role node it's now a
// first-class `DiagramRoleDetail` instead. No `color`: roles have no assignable color
// anywhere in the app (no such field on the role form), so nothing here should imply
// one — the container/node keep using their own element color.
export interface CanvasElementRole {
  id: string
  name: string
}

// Roles no longer travel through `texts` as a free-standing element (they're a
// first-class `InitialCanvasRoleNode` now) — only text/container remain here.
export type InitialCanvasElementKind = Extract<CanvasElementKind, 'text' | 'container'>

// A text/container element to seed the canvas with on mount, at an explicit saved
// position/size (used to reopen a previously-saved Diagram for editing).
export interface InitialCanvasElement {
  kind: InitialCanvasElementKind
  content: string
  color: string
  position: { x: number; y: number }
  width: number
  height: number
  // Container-only: turns it into a lane. A role node's role lives on the node itself.
  role?: CanvasElementRole
}

// A local-only role↔role or role↔asset edge, pending the "name / type" dialog before
// it's added to the canvas — nothing is sent to the backend until the diagram is saved.
export interface PendingRoleEdge {
  sourceId: string
  targetId: string
  sourceLabel: string
  targetLabel: string
  sourceColor?: string
  targetColor?: string
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

// ─── Floating canvas toolbars ───────────────────────────────────────────────────

export interface CanvasElementPaletteProps {
  /** Mismo valor que `canAddRoleNode` del canvas — oculta el ítem "Rol" fuera de execution/sin permiso. */
  canAddRole: boolean
  /** Mismo valor que `canAddFlowNode` del canvas — oculta Inicio/Rombo/Fin fuera de execution/sin permiso. */
  canAddFlow: boolean
  /** Click: agrega el elemento al centro del viewport (`addElementAtCenter`). */
  onAdd: (kind: CanvasElementKind | FlowCanvasNodeType) => void
  /** Canvas angosto: oculta el eyebrow y los labels, deja solo iconos con tooltip. */
  compact?: boolean
}

export interface CanvasActionsBarProps {
  /** Nombre del diagrama en edición; ausente ⇒ se muestra un título genérico. */
  diagramName?: string
  isDirty: boolean
  isSaving: boolean
  /** El canvas no tiene nodos: promueve "Cargar diagrama" a botón visible. */
  isEmpty?: boolean
  /** Canvas angosto: labels → iconos + tooltip. */
  compact?: boolean
  /** Canvas muy angosto: toda la barra colapsa a un único menú "⋯". */
  collapsed?: boolean
  // Cada handler `undefined` = acción no permitida/no aplicable en el modo actual
  // ⇒ el botón correspondiente NO se renderiza (nunca se muestra deshabilitado).
  onSaveChanges?: () => void
  onSaveAsNew?: () => void
  onEditMetadata?: () => void
  onLoadDiagram?: () => void
  onClearCanvas?: () => void
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export interface AssetTypeSidebarProps {
  items: DocumentType[]
  isLoading?: boolean
  page: number
  pageSize: number
  // Búsqueda del panel: vive en el header del sidebar (HuemulPanelHeader), no en
  // el header de la columna del layout, para que todos los paneles laterales del
  // producto expongan la búsqueda en el mismo lugar.
  search?: string
  onSearchChange?: (value: string) => void
  /** Commit de la búsqueda (Enter): es cuando se consulta al servidor. */
  onSearchCommit?: (value: string) => void
  searchPlaceholder?: string
  // Hides the "role" drag item when the user can't list roles (same gate as the
  // toolbar's "Add Role" button and the @role mention picker).
  canPickRole?: boolean
}

export interface AssetTypeDraggableItemProps {
  item: DocumentType
}
