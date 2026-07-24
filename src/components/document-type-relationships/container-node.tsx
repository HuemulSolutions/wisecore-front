"use client"

import { memo, useEffect, useRef, useState } from "react"
import { NodeResizer, type NodeProps, type Node } from "@xyflow/react"
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

type ContainerNodeType = Node<CanvasElementNodeData, "container">

// Resizable, colored-border box grouping other nodes visually. Its `content` is a
// mandatory title — the backend rejects a blank `content` on the persisted text row,
// so a container can never be an untitled empty box.
export function ContainerNode({ data, selected }: NodeProps<ContainerNodeType>) {
  const { t } = useTranslation("document-type-relationships")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [draft, setDraft] = useState(data.content)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setDraft(data.content), [data.content])

  useEffect(() => {
    if (isEditingTitle) inputRef.current?.focus()
  }, [isEditingTitle])

  const commit = () => {
    setIsEditingTitle(false)
    const next = draft.trim() || data.content
    setDraft(next)
    if (next !== data.content) data.onContentChange?.(data.id, next)
  }

  const nodeContent = (
    <div
      className={cn(
        "h-full w-full rounded-lg border-2 bg-transparent overflow-hidden",
        "transition-shadow",
        selected ? "shadow-md" : "",
      )}
      style={{ borderColor: data.color || "#94a3b8" }}
    >
      <NodeResizer
        color={data.color || "#94a3b8"}
        isVisible={selected}
        minWidth={120}
        minHeight={80}
      />
      <div
        className="h-full overflow-y-auto px-2 py-1 text-xs font-semibold whitespace-pre-wrap break-words select-none"
        style={{ color: data.color || "#94a3b8" }}
        onDoubleClick={() => setIsEditingTitle(true)}
      >
        {isEditingTitle ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); commit() }
              if (e.key === "Escape") { setDraft(data.content); setIsEditingTitle(false) }
            }}
            className="nodrag w-full bg-transparent outline-none border-b border-dashed"
          />
        ) : (
          data.content
        )}
      </div>
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

export const MemoizedContainerNode = memo(ContainerNode)
