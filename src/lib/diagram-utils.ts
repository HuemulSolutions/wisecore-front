import type { Diagram } from "@/types/diagrams"
import type { InitialCanvasNode } from "@/types/document-type-relationships"

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
