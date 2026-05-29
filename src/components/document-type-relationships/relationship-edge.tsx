"use client"

import { memo } from "react"
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useInternalNode,
  Position,
  type EdgeProps,
  type Edge,
  type InternalNode,
} from "@xyflow/react"
import { Edit2, Trash2, Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface RelationshipEdgeData {
  relationshipId: string
  name: string
  minCount: number
  maxCount: number
  /** Signed offset index used to vary curvature for parallel edges */
  pathOffset?: number
  onEdit: (relationshipId: string) => void
  onDelete: (relationshipId: string) => void
  onManageAttributes: (relationshipId: string) => void
  [key: string]: unknown
}

type RelationshipEdgeType = Edge<RelationshipEdgeData, "relationship">

// ─── Floating-edge utilities ───────────────────────────────────────────────────

function getNodeCenter(node: InternalNode) {
  return {
    x: node.internals.positionAbsolute.x + (node.measured.width ?? 0) / 2,
    y: node.internals.positionAbsolute.y + (node.measured.height ?? 0) / 2,
  }
}

/**
 * Given a node and the center of the other node, find which handle position
 * is closest (Top/Right/Bottom/Left) and return its canvas coordinates.
 */
function getFloatingHandleParams(
  node: InternalNode,
  otherCenter: { x: number; y: number },
): [number, number, Position] {
  const center = getNodeCenter(node)
  const dx = otherCenter.x - center.x
  const dy = otherCenter.y - center.y

  // Pick dominant axis
  const position =
    Math.abs(dx) >= Math.abs(dy)
      ? dx > 0
        ? Position.Right
        : Position.Left
      : dy > 0
        ? Position.Bottom
        : Position.Top

  // Find the matching source handle in handleBounds
  const handle = node.internals.handleBounds?.source?.find((h) => h.position === position)

  if (handle) {
    let ox = handle.width / 2
    let oy = handle.height / 2
    if (position === Position.Left) ox = 0
    if (position === Position.Right) ox = handle.width
    if (position === Position.Top) oy = 0
    if (position === Position.Bottom) oy = handle.height
    return [
      node.internals.positionAbsolute.x + handle.x + ox,
      node.internals.positionAbsolute.y + handle.y + oy,
      position,
    ]
  }

  // Fallback: use node center edge
  const w = (node.measured.width ?? 0) / 2
  const h = (node.measured.height ?? 0) / 2
  const fallbacks: Record<Position, [number, number]> = {
    [Position.Top]:    [center.x, center.y - h],
    [Position.Bottom]: [center.x, center.y + h],
    [Position.Left]:   [center.x - w, center.y],
    [Position.Right]:  [center.x + w, center.y],
  }
  return [...fallbacks[position], position]
}

function getEdgeParams(source: InternalNode, target: InternalNode) {
  const targetCenter = getNodeCenter(target)
  const sourceCenter = getNodeCenter(source)
  const [sx, sy, sourcePos] = getFloatingHandleParams(source, targetCenter)
  const [tx, ty, targetPos] = getFloatingHandleParams(target, sourceCenter)
  return { sx, sy, tx, ty, sourcePos, targetPos }
}

// ─── Edge component ────────────────────────────────────────────────────────────

export function RelationshipEdge({
  id,
  source,
  target,
  selected,
  data,
  markerEnd,
}: EdgeProps<RelationshipEdgeType>) {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)
  const edgeData = data!

  if (!sourceNode || !targetNode) return null

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode)

  // Vary curvature to separate parallel edges; offset units come from parallelOffset()
  const offset = edgeData.pathOffset ?? 0
  const curvature = 0.25 + (offset / 14) * 0.35

  const strokeColor = selected ? "var(--primary)" : "var(--muted-foreground)"

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
    targetPosition: targetPos,
    curvature,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: selected ? 2 : 1.5,
          stroke: strokeColor,
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan flex flex-col items-center gap-1"
        >
          <span
            className={cn(
              "text-[11px] font-medium px-1.5 py-0.5 rounded bg-background whitespace-nowrap max-w-[160px] truncate",
              selected ? "text-primary" : "text-muted-foreground",
            )}
          >
            {edgeData.name}
          </span>

          {selected && (
            <div className="flex items-center gap-0.5 bg-background border rounded-md px-1 py-0.5 shadow-sm">
              <button
                onClick={() => edgeData.onEdit(edgeData.relationshipId)}
                className="p-1 rounded hover:bg-accent hover:cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                title="Edit relationship"
              >
                <Edit2 className="h-3 w-3" />
              </button>
              <button
                onClick={() => edgeData.onManageAttributes(edgeData.relationshipId)}
                className="p-1 rounded hover:bg-accent hover:cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                title="Manage attributes"
              >
                <Settings2 className="h-3 w-3" />
              </button>
              <button
                onClick={() => edgeData.onDelete(edgeData.relationshipId)}
                className="p-1 rounded hover:bg-destructive/10 hover:cursor-pointer text-muted-foreground hover:text-destructive transition-colors"
                title="Delete relationship"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export const MemoizedRelationshipEdge = memo(RelationshipEdge)
