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

type StartEventNodeType = Node<CanvasElementNodeData, "startEvent">

const handleClass =
  "!w-1.75 !h-1.75 !border-[1.5px] !border-[var(--diagram-event-start-border)] !bg-white transition-colors hover:!bg-[var(--diagram-event-start-fill)]"
const handleReadOnlyClass = "!opacity-0 !pointer-events-none"

// Thin-bordered circle marking where a flow begins. The label sits absolutely below
// the circle so it never contributes to the node's measured bounding box (the
// backend-persisted `position.width/height`) — an edited label can't silently drift
// the handles.
export function StartEventNode({ data, selected }: NodeProps<StartEventNodeType>) {
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
    <div className="relative h-16 w-16 select-none">
      <div
        className={cn(
          "h-full w-full rounded-full border-2 transition-shadow",
          selected ? "shadow-[0_2px_8px_rgba(22,163,74,0.2)]" : "hover:shadow-[0_2px_8px_rgba(22,163,74,0.14)]",
        )}
        style={{
          backgroundColor: "var(--diagram-event-start-fill)",
          borderColor: "var(--diagram-event-start-border)",
        }}
      />
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-24 pointer-events-none"
        onDoubleClick={(e) => { if (!data.readOnly) { e.stopPropagation(); setIsEditing(true) } }}
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
            className="nodrag pointer-events-auto w-full resize-none bg-transparent outline-none border border-dashed rounded px-1 text-center text-[11px] font-medium"
            style={{ color: "var(--diagram-event-start-label)" }}
            rows={1}
          />
        ) : (
          <p
            className="pointer-events-auto text-center text-[11px] font-medium leading-tight wrap-break-word"
            style={{ color: "var(--diagram-event-start-label)" }}
          >
            {data.content}
          </p>
        )}
      </div>
      {/* Rendered last so they always paint above the circle fill/label — same
          defensive ordering as GatewayNode's handles. */}
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

export const MemoizedStartEventNode = memo(StartEventNode)
