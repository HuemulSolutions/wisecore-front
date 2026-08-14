import type { Diagram } from "@/types/diagrams"
import type { InitialCanvasNode, InitialCanvasElement, CanvasElementKind, CanvasElementRole } from "@/types/document-type-relationships"

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
