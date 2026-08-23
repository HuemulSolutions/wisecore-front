import type { Edge, Node } from "@xyflow/react"
import type {
  Diagram,
  DiagramDetail,
  DiagramRoleDetail,
  DiagramDetailInput,
  DiagramRelationshipInput,
  DiagramTextInput,
} from "@/types/diagrams"
import type {
  InitialCanvasNode,
  InitialCanvasElement,
  InitialCanvasElementKind,
  InitialCanvasRelationship,
  CanvasElementKind,
  CanvasElementRole,
} from "@/types/document-type-relationships"
import type { AssetTypeNodeData } from "@/components/document-type-relationships/asset-type-node"
import type { CanvasElementNodeData } from "@/components/document-type-relationships/text-node"
import type { RelationshipEdgeData } from "@/components/document-type-relationships/relationship-edge"
import { logger } from "@/lib/logger"

// The canvas mixes asset nodes with free-standing text/container/role elements; both
// the read (seed) and write (payload) sides only care about telling them apart by
// `type` and `data`.
export type CanvasNode = Node<AssetTypeNodeData | CanvasElementNodeData>

const DEFAULT_ELEMENT_WIDTH = 160
const DEFAULT_ELEMENT_HEIGHT = 80

// Shared between the canvas (new element defaults) and the payload builder — a single
// map avoids the two sides silently drifting apart.
export const DEFAULT_CANVAS_ELEMENT_COLOR: Record<CanvasElementKind, string> = {
  text: "#0f172a",
  container: "#94a3b8",
  role: "#6366f1",
}

// Id prefixes — kept for stable React keys and de-dup, no longer load-bearing as the
// edge's semantic classification (see `RelationshipEdgeData.edgeKind`).
export const EXEC_EDGE_ID_PREFIX = "exec-rel-"
export const DIRECT_EDGE_ID_PREFIX = "diagram-edge-"

/** Absence of `node_type` on a legacy-shaped payload defaults to an execution detail. */
export function isRoleDetail(d: DiagramDetail): d is DiagramRoleDetail {
  return d.node_type === "role"
}

// ─── Read: a single constructor ────────────────────────────────────────────────

/**
 * Builds the RelationshipsCanvas seed nodes/elements/relationships from a saved
 * Diagram. A single function because the rule "a role stashed in `texts` is a NODE,
 * not an element" has to live in exactly one place — split into two independent
 * functions, a legacy role could get seeded twice (once per function) or not at all.
 *
 * 1. `details` → nodes (role or execution branch — the backend denormalizes both).
 * 2. `texts` split: `position.kind === 'role'` with `role_id`+`role_name` → a node
 *    (legacy role, migrates to `details` on next save); `kind === 'role'` without them
 *    (corrupt) → seeded as a plain text with its `content` preserved + a warning; the
 *    rest → elements, containers with `position.role_id` included (unchanged).
 * 3. `relationships` passed through as-is — already resolved by the backend.
 */
export function buildInitialCanvasGraph(diagram: Diagram): {
  nodes: InitialCanvasNode[]
  elements: InitialCanvasElement[]
  relationships: InitialCanvasRelationship[]
} {
  const nodes: InitialCanvasNode[] = diagram.details.map((d) => {
    const position = d.position as { x?: number; y?: number }
    const pos = { x: Number(position?.x ?? 0), y: Number(position?.y ?? 0) }
    if (isRoleDetail(d)) {
      return { nodeType: "role", role: { id: d.role_id, name: d.role_name }, position: pos }
    }
    return {
      nodeType: "execution",
      assetId: d.document_id,
      documentTypeId: d.document_type.id,
      executionId: d.execution_id,
      executionName: d.execution_name,
      name: d.document_name ?? d.document_type.name,
      color: d.document_type.color,
      position: pos,
    }
  })

  const elements: InitialCanvasElement[] = []

  for (const txt of diagram.texts) {
    const position = txt.position as {
      x?: number; y?: number; width?: number; height?: number; kind?: CanvasElementKind
      role_id?: string; role_name?: string
    }
    const kind: CanvasElementKind = position?.kind ?? (txt.has_border ? "container" : "text")
    const pos = { x: Number(position?.x ?? 0), y: Number(position?.y ?? 0) }

    if (kind === "role") {
      // Legacy Phase 1 hack: a role node lived inside `texts` with `position.kind`.
      // With role_id+role_name it becomes a first-class node (migrates to `details`
      // on the next save via the allow-list in buildDiagramGraphPayload); without them
      // it's corrupt — seed it as plain text so the user's content isn't dropped.
      if (position?.role_id && position?.role_name) {
        nodes.push({
          nodeType: "role",
          role: { id: position.role_id, name: position.role_name },
          position: pos,
          color: txt.font_color ?? undefined,
        })
      } else {
        logger.warn("[diagram-utils] legacy role text without role_id/role_name — seeding as text", txt.id)
        elements.push({
          kind: "text",
          content: txt.content,
          color: txt.font_color ?? DEFAULT_CANVAS_ELEMENT_COLOR.text,
          position: pos,
          width: Number(position?.width ?? DEFAULT_ELEMENT_WIDTH),
          height: Number(position?.height ?? DEFAULT_ELEMENT_HEIGHT),
        })
      }
      continue
    }

    const role: CanvasElementRole | undefined = position?.role_id && position?.role_name
      ? { id: position.role_id, name: position.role_name }
      : undefined
    elements.push({
      kind,
      content: txt.content,
      color: (kind === "container" ? txt.border_color : txt.font_color) ?? (kind === "container" ? "#94a3b8" : "#0f172a"),
      position: pos,
      width: Number(position?.width ?? DEFAULT_ELEMENT_WIDTH),
      height: Number(position?.height ?? DEFAULT_ELEMENT_HEIGHT),
      ...(role ? { role } : {}),
    })
  }

  return { nodes, elements, relationships: diagram.relationships }
}

/** Thin wrapper over `buildInitialCanvasGraph` — signature kept for existing callers. */
export function buildInitialCanvasNodes(diagram: Diagram): InitialCanvasNode[] {
  return buildInitialCanvasGraph(diagram).nodes
}

/** Thin wrapper over `buildInitialCanvasGraph` — signature kept for existing callers. */
export function buildInitialCanvasElements(diagram: Diagram): InitialCanvasElement[] {
  return buildInitialCanvasGraph(diagram).elements
}

// ─── Write ──────────────────────────────────────────────────────────────────────

export type DetailEndpoint = { kind: "execution"; executionId: string } | { kind: "role"; roleId: string }

/**
 * Persistable endpoint of a canvas node, or null if it never reaches `details` (a
 * text/container, an asset with no version selected, or a role node with no role
 * assigned). Exported so `onConnect` can apply the exact same rule the payload
 * builder uses below — an edge that would resolve to nothing here is invalid to draw.
 */
export function detailEndpointOf(node: CanvasNode): DetailEndpoint | null {
  if (node.type === "assetType") {
    const d = node.data as AssetTypeNodeData
    if (d.assetId && d.executionId) return { kind: "execution", executionId: d.executionId }
    return null
  }
  if (node.type === "role") {
    const d = node.data as CanvasElementNodeData
    if (d.role?.id) return { kind: "role", roleId: d.role.id }
    return null
  }
  return null
}

/**
 * Inverse of `buildInitialCanvasGraph`: turns the live canvas into the
 * `details`/`texts`/`relationships` triplet that both POST /diagrams and PUT
 * /diagrams/{id} expect. Shared by every save path (create, save changes and
 * metadata-only edit) so the persisted graph can't diverge between them — the PUT
 * fully replaces these three collections, so a metadata edit still has to send them.
 */
export function buildDiagramGraphPayload(
  nodes: CanvasNode[],
  edges: Edge<RelationshipEdgeData>[],
): { details: DiagramDetailInput[]; texts: DiagramTextInput[]; relationships: DiagramRelationshipInput[] } {
  const execNodes = nodes.filter((n) => n.type === "assetType" && (n.data as AssetTypeNodeData).assetId && (n.data as AssetTypeNodeData).executionId)
  const execDetails: DiagramDetailInput[] = execNodes.map((n) => {
    const d = n.data as AssetTypeNodeData
    return {
      node_type: "execution",
      execution_id: d.executionId as string,
      document_id: d.assetId as string,
      position: {
        x: n.position.x,
        y: n.position.y,
        width: n.measured?.width ?? 180,
        height: n.measured?.height ?? 80,
      },
    }
  })

  const roleNodes = nodes.filter((n) => n.type === "role" && (n.data as CanvasElementNodeData).role?.id) as Node<CanvasElementNodeData>[]

  // Defensive dedup: two role nodes for the same role_id survive UI validation only
  // via a legacy diagram or a race — keep the first, remap the discarded node's canvas
  // id to the survivor's below so its edges aren't dropped as "endpoint not in details".
  // Never applied at seed time (§ buildInitialCanvasGraph never dedups on read).
  const seenRoleIds = new Map<string, string>() // role_id -> survivor canvas node id
  const roleNodeRemap = new Map<string, string>() // discarded canvas node id -> survivor canvas node id
  const dedupedRoleNodes: Node<CanvasElementNodeData>[] = []
  for (const n of roleNodes) {
    const roleId = n.data.role!.id
    const survivorId = seenRoleIds.get(roleId)
    if (survivorId) {
      roleNodeRemap.set(n.id, survivorId)
      continue
    }
    seenRoleIds.set(roleId, n.id)
    dedupedRoleNodes.push(n)
  }

  const roleDetails: DiagramDetailInput[] = dedupedRoleNodes.map((n) => ({
    node_type: "role",
    role_id: n.data.role!.id,
    position: {
      x: n.position.x,
      y: n.position.y,
      width: n.measured?.width ?? 96,
      height: n.measured?.height ?? 96,
    },
  }))

  const details: DiagramDetailInput[] = [...execDetails, ...roleDetails]

  // Single source of truth for "is in details": an edge whose endpoint isn't in this
  // map gets discarded below. Covers both DIAGRAM_RELATIONSHIP_EXECUTION_NOT_IN_DETAILS
  // and the equivalent role case with one rule instead of two parallel branches.
  const endpointByNodeId = new Map<string, DetailEndpoint>()
  for (const n of execNodes) {
    const d = n.data as AssetTypeNodeData
    endpointByNodeId.set(n.id, { kind: "execution", executionId: d.executionId as string })
  }
  for (const n of dedupedRoleNodes) {
    endpointByNodeId.set(n.id, { kind: "role", roleId: n.data.role!.id })
  }
  for (const [discardedId, survivorId] of roleNodeRemap) {
    const survivorEndpoint = endpointByNodeId.get(survivorId)
    if (survivorEndpoint) endpointByNodeId.set(discardedId, survivorEndpoint)
  }

  // Relationships — classified by edgeKind, with a prefix fallback for edges still
  // in memory from before this field existed. `undefined` is discarded, never assumed
  // to be 'direct'.
  const execRelIds = new Set<string>()
  const directRelMap = new Map<string, DiagramRelationshipInput>()

  for (const e of edges) {
    const edgeData = e.data as RelationshipEdgeData | undefined
    const edgeKind = edgeData?.edgeKind ?? (e.id.startsWith(EXEC_EDGE_ID_PREFIX) ? "execution-relationship" : undefined)
    if (!edgeKind) continue

    if (edgeKind === "execution-relationship") {
      const srcEp = endpointByNodeId.get(e.source)
      const tgtEp = endpointByNodeId.get(e.target)
      if (srcEp?.kind !== "execution" || tgtEp?.kind !== "execution") continue
      const relId = edgeData?.relationshipId
      if (relId) execRelIds.add(relId)
      continue
    }

    if (edgeKind === "direct") {
      const srcEp = endpointByNodeId.get(e.source)
      const tgtEp = endpointByNodeId.get(e.target)
      if (!srcEp || !tgtEp) continue
      if (srcEp.kind !== "role" && tgtEp.kind !== "role") {
        logger.warn("[diagram-utils] direct edge between two execution nodes — dropping", e.id)
        continue
      }
      const name = edgeData?.name || null
      const relationshipType = (edgeData?.relationshipType as string | undefined) || null
      const srcKey = srcEp.kind === "role" ? `role:${srcEp.roleId}` : `exec:${srcEp.executionId}`
      const tgtKey = tgtEp.kind === "role" ? `role:${tgtEp.roleId}` : `exec:${tgtEp.executionId}`
      // Dedup key includes name+type on purpose: two parallel edges with different
      // labels are legitimate, two identical ones collapse (otherwise every save adds
      // another row).
      const dedupKey = `${srcKey}->${tgtKey}::${name ?? ""}::${relationshipType ?? ""}`
      if (directRelMap.has(dedupKey)) continue
      directRelMap.set(dedupKey, {
        ...(srcEp.kind === "role" ? { source_role_id: srcEp.roleId } : { source_execution_id: srcEp.executionId }),
        ...(tgtEp.kind === "role" ? { target_role_id: tgtEp.roleId } : { target_execution_id: tgtEp.executionId }),
        relationship_type: relationshipType,
        name,
      } as DiagramRelationshipInput)
      continue
    }

    // 'document-type-relationship' (rel-) → discarded, as today.
  }

  const relationships: DiagramRelationshipInput[] = [
    ...Array.from(execRelIds).map((id) => ({ execution_relationship_id: id })),
    ...Array.from(directRelMap.values()),
  ]

  // Free-standing text/container elements → Diagram `texts`. Roles now go to
  // `details` — this allow-list (rather than a deny-list) is the most important line
  // of the migration: with a deny-list a role node would persist twice (detail + text)
  // and show up duplicated on the next load.
  // A container's assigned role has no first-class column on diagram_texts yet, so
  // `role_id/role_name` are stashed there too (no `role_color` — roles have no
  // assignable color anywhere in the app).
  // A blank `content` is filtered out — the backend rejects it (422 VALIDATION_ERROR).
  const elementNodes = nodes.filter((n) => n.type === "text" || n.type === "container")
  const texts: DiagramTextInput[] = elementNodes
    .filter((n) => String((n.data as CanvasElementNodeData).content ?? "").trim())
    .map((n) => {
      const data = n.data as CanvasElementNodeData
      const isContainer = n.type === "container"
      return {
        content: data.content.trim(),
        position: {
          x: n.position.x,
          y: n.position.y,
          width: n.measured?.width ?? n.width ?? DEFAULT_ELEMENT_WIDTH,
          height: n.measured?.height ?? n.height ?? DEFAULT_ELEMENT_HEIGHT,
          kind: n.type as InitialCanvasElementKind,
          ...(data.role ? { role_id: data.role.id, role_name: data.role.name } : {}),
        },
        has_border: isContainer,
        border_type: isContainer ? "solid" : undefined,
        border_color: isContainer ? data.color : undefined,
        font_color: !isContainer ? data.color : undefined,
      }
    })

  return { details, texts, relationships }
}
