"use client"

import { memo, useEffect, useRef, useState } from "react"
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"
import type { CanvasElementNodeData } from "./text-node"

type GatewayNodeType = Node<CanvasElementNodeData, "gateway">

const handleClass =
  "!w-1.75 !h-1.75 !border-[1.5px] !border-[var(--diagram-gateway-border)] !bg-white transition-colors hover:!bg-[var(--diagram-gateway-fill)]"
const handleReadOnlyClass = "!opacity-0 !pointer-events-none"

// Decision node — a diamond clipped out of a square wrapper (see the clip-path note
// below for why it's not a rotated square). Handles use the plain Top/Right/Bottom/
// Left positions on the wrapper, which land exactly on the diamond's four vertices —
// the midpoints of the wrapper's own edges.
export function GatewayNode({ data, selected }: NodeProps<GatewayNodeType>) {
  const { t } = useTranslation("document-type-relationships")
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(data.content)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => setDraft(data.content), [data.content])
  useEffect(() => {
    if (isEditing) inputRef.current?.focus()
  }, [isEditing])

  const commit = () => {
    setIsEditing(false)
    const next = draft.trim() || data.content
    setDraft(next)
    if (next !== data.content) data.onContentChange?.(data.id, next)
  }

  const nodeContent = (
    <div className="relative h-22 w-22 select-none">
      {/* `clip-path` (not a rotated square): rotating a square by 45° enlarges its
          visual bounding box to `side·√2`, which bled ~7px past this wrapper's edges
          and painted over the handles below (they sit exactly at the wrapper's edge
          midpoints). A clip-path polygon never paints outside its own box, so its
          4 vertices land exactly on the wrapper's edge midpoints — the same points
          Position.Top/Right/Bottom/Left use for the handles — with no risk of overflow. */}
      <div
        className={cn(
          "absolute inset-0 border transition-shadow",
          selected ? "border-[1.5px] shadow-[0_2px_8px_rgba(217,119,6,0.18)]" : "hover:shadow-[0_2px_8px_rgba(217,119,6,0.14)]",
        )}
        style={{
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
          backgroundColor: "var(--diagram-gateway-fill)",
          borderColor: "var(--diagram-gateway-border)",
        }}
      />
      <div
        className="absolute inset-0 flex items-center justify-center px-3"
        onDoubleClick={() => { if (!data.readOnly) setIsEditing(true) }}
      >
        {isEditing ? (
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setDraft(data.content); setIsEditing(false) }
            }}
            className="nodrag w-14 resize-none bg-transparent outline-none text-center text-[11px] font-semibold"
            style={{ color: "var(--diagram-gateway-label)" }}
            rows={2}
          />
        ) : (
          <p
            className="text-[11px] font-semibold text-center leading-tight line-clamp-3 wrap-break-word"
            style={{ color: "var(--diagram-gateway-label)" }}
          >
            {data.content}
          </p>
        )}
      </div>
      {/* Rendered last so they always paint above the diamond fill/label, regardless
          of any residual overlap at the exact vertex points. */}
      <Handle type="source" position={Position.Top}    id="top"    isConnectable={!data.readOnly}
        className={cn(handleClass, data.readOnly && handleReadOnlyClass)}
      />
      <Handle type="source" position={Position.Right}  id="right"  isConnectable={!data.readOnly}
        className={cn(handleClass, data.readOnly && handleReadOnlyClass)}
      />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={!data.readOnly}
        className={cn(handleClass, data.readOnly && handleReadOnlyClass)}
      />
      <Handle type="source" position={Position.Left}   id="left"   isConnectable={!data.readOnly}
        className={cn(handleClass, data.readOnly && handleReadOnlyClass)}
      />
    </div>
  )

  if (data.readOnly) {
    return nodeContent
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{nodeContent}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem
          className="hover:cursor-pointer text-destructive focus:text-destructive"
          onClick={() => data.onRemove?.(data.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>{t("node.removeFromCanvas")}</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export const MemoizedGatewayNode = memo(GatewayNode)
