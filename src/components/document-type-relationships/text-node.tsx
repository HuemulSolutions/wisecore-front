"use client"

import { memo, useEffect, useRef, useState } from "react"
import { type NodeProps, type Node } from "@xyflow/react"
import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"
import type { CanvasElementKind } from "@/types/document-type-relationships"

export interface CanvasElementNodeData {
  id: string
  kind: CanvasElementKind
  content: string
  color: string
  onContentChange?: (id: string, content: string) => void
  onColorChange?: (id: string, color: string) => void
  onRemove?: (id: string) => void
  [key: string]: unknown
}

type TextNodeType = Node<CanvasElementNodeData, "text">

// Free-floating text label — no connection handles, double-click to edit inline.
export function TextNode({ data, selected }: NodeProps<TextNodeType>) {
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
    <div
      className={cn(
        "px-2 py-1 rounded-md min-w-[80px] max-w-[280px]",
        "transition-shadow",
        selected ? "ring-2 ring-primary/40" : "",
      )}
      onDoubleClick={() => setIsEditing(true)}
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
          className="nodrag w-full min-w-[120px] resize-none bg-transparent outline-none border border-dashed rounded px-1 text-sm"
          style={{ color: data.color || "#0f172a" }}
          rows={2}
        />
      ) : (
        <p
          className="text-sm whitespace-pre-wrap break-words select-none"
          style={{ color: data.color || "#0f172a" }}
        >
          {data.content}
        </p>
      )}
    </div>
  )

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

export const MemoizedTextNode = memo(TextNode)
