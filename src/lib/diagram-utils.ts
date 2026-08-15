import type { Edge, Node } from "@xyflow/react"
import type {
  Diagram,
  DiagramDetailInput,
  DiagramRelationshipInput,
  DiagramTextInput,
} from "@/types/diagrams"
import type { InitialCanvasNode, InitialCanvasElement, CanvasElementKind, CanvasElementRole } from "@/types/document-type-relationships"
import type { AssetTypeNodeData } from "@/components/document-type-relationships/asset-type-node"
import type { CanvasElementNodeData } from "@/components/document-type-relationships/text-node"
import type { RelationshipEdgeData } from "@/components/document-type-relationships/relationship-edge"

/**
 * Builds the RelationshipsCanvas seed nodes from a saved Diagram. The backend
 * embeds execution_name/document_type in each detail, so this is a plain map —
 * no per-node execution/document lookups needed.
 */
export function buildInitialCanvasNodes(diagram: Diagram): InitialCanvasNode[] {
  return diagram.details.map((d) => {
    const position = d.position as { x?: number; y?: number }
    return {
      assetId: d.document_id,
      documentTypeId: d.document_type.id,
      executionId: d.execution_id,
      executionName: d.execution_name,
      name: d.document_name ?? d.document_type.name,
      color: d.document_type.color,
      position: { x: Number(position?.x ?? 0), y: Number(position?.y ?? 0) },
    }
  })
}

const DEFAULT_ELEMENT_WIDTH = 160
const DEFAULT_ELEMENT_HEIGHT = 80

/**
 * Builds the RelationshipsCanvas seed text/container/role elements from a saved
 * Diagram's `texts`. A container is a bordered text row (has_border) whose `content`
 * is its title; a plain text row (no border) is a free-floating label; a "role" only
 * ever arrives via `position.kind` (there's no backend flag for it, unlike
 * has_border). The assigned role, when any, is stashed as `role_id`/`role_name` inside
 * `position` too — the backend has no first-class column for it yet. No `role_color`:
 * roles have no assignable color anywhere in the app.
 */
export function buildInitialCanvasElements(diagram: Diagram): InitialCanvasElement[] {
  return diagram.texts.map((txt) => {
    const position = txt.position as {
      x?: number; y?: number; width?: number; height?: number; kind?: CanvasElementKind
      role_id?: string; role_name?: string
    }
    const kind: CanvasElementKind = position?.kind ?? (txt.has_border ? "container" : "text")
    const role: CanvasElementRole | undefined = position?.role_id && position?.role_name
      ? { id: position.role_id, name: position.role_name }
      : undefined
    return {
      kind,
      content: txt.content,
      color: (kind === "container" ? txt.border_color : txt.font_color) ?? (kind === "container" ? "#94a3b8" : "#0f172a"),
      position: { x: Number(position?.x ?? 0), y: Number(position?.y ?? 0) },
      width: Number(position?.width ?? DEFAULT_ELEMENT_WIDTH),
      height: Number(position?.height ?? DEFAULT_ELEMENT_HEIGHT),
      ...(role ? { role } : {}),
    }
  })
}

// The canvas mixes asset nodes with free-standing text/container/role elements; the
// payload builder only cares about telling them apart by `type` and `data`.
type CanvasNode = Node<AssetTypeNodeData | CanvasElementNodeData>

/**
 * Inverse of `buildInitialCanvasNodes`/`buildInitialCanvasElements`: turns the live
 * canvas into the `details`/`texts`/`relationships` triplet that both POST /diagrams
 * and PUT /diagrams/{id} expect. Shared by every save path (create, save changes and
 * metadata-only edit) so the persisted graph can't diverge between them — the PUT
 * fully replaces these three collections, so a metadata edit still has to send them.
 */
export function buildDiagramGraphPayload(
  nodes: CanvasNode[],
  edges: Edge<RelationshipEdgeData>[],
): { details: DiagramDetailInput[]; texts: DiagramTextInput[]; relationships: DiagramRelationshipInput[] } {
  const validNodes = nodes.filter((n) => n.data.assetId && n.data.executionId)
  const validNodeIds = new Set(validNodes.map((n) => n.id))

  const details: DiagramDetailInput[] = validNodes.map((n) => ({
    execution_id: n.data.executionId as string,
    document_id: n.data.assetId as string,
    position: {
      x: n.position.x,
      y: n.position.y,
      width: n.measured?.width ?? 180,
      height: n.measured?.height ?? 80,
    },
  }))

  // Only edges whose both ends are in `details` survive — the backend rejects
  // edges "hanging" off a box that isn't part of the same request (DIAGRAM_RELATIONSHIP_EXECUTION_NOT_IN_DETAILS).
  const relIds = new Set<string>()
  for (const e of edges) {
    if (!e.id.startsWith('exec-rel-')) continue
    if (!validNodeIds.has(e.source) || !validNodeIds.has(e.target)) continue
    const relId = (e.data as RelationshipEdgeData | undefined)?.relationshipId
    if (relId) relIds.add(relId)
  }
  const relationships: DiagramRelationshipInput[] = Array.from(relIds).map((id) => ({
    execution_relationship_id: id,
  }))

  // Free-standing text/container/role elements → Diagram `texts`. `kind` is
  // stashed in `position` so the exact element type is reconstructed on reload.
  // A container's or role node's assigned role has no first-class column on
  // diagram_texts yet, so `role_id/role_name` are stashed there too (no
  // `role_color` — roles have no assignable color anywhere in the app).
  // A blank `content` is filtered out — the backend rejects it (422 VALIDATION_ERROR).
  const elementNodes = nodes.filter((n) => n.type === 'text' || n.type === 'container' || n.type === 'role')
  const texts: DiagramTextInput[] = elementNodes
    .filter((n) => String((n.data as CanvasElementNodeData).content ?? '').trim())
    .map((n) => {
      const data = n.data as CanvasElementNodeData
      const isContainer = n.type === 'container'
      return {
        content: data.content.trim(),
        position: {
          x: n.position.x,
          y: n.position.y,
          width: n.measured?.width ?? n.width ?? DEFAULT_ELEMENT_WIDTH,
          height: n.measured?.height ?? n.height ?? DEFAULT_ELEMENT_HEIGHT,
          kind: n.type,
          ...(data.role ? { role_id: data.role.id, role_name: data.role.name } : {}),
        },
        has_border: isContainer,
        border_type: isContainer ? 'solid' : undefined,
        border_color: isContainer ? data.color : undefined,
        font_color: !isContainer ? data.color : undefined,
      }
    })

  return { details, texts, relationships }
}
