"use client"

import { memo, useEffect, useRef, useState } from "react"
import { NodeResizer, type NodeProps, type Node } from "@xyflow/react"
import { Shield, Trash2, UserCog, UserX } from "lucide-react"
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

  const color = data.color || "#94a3b8"

  const nodeContent = (
    <div
      className={cn(
        "relative h-full w-full rounded-lg border-2 bg-transparent",
        "transition-shadow",
        selected ? "shadow-md" : "",
      )}
      style={{ borderColor: color }}
    >
      {!data.readOnly && (
        <NodeResizer
          color={color}
          isVisible={selected}
          handleClassName="z-10"
          lineClassName="z-10"
          minWidth={120}
          minHeight={80}
        />
      )}
      {/* Role badge — sits on top of the border line like a fieldset legend, so it
          reads as the lane's label rather than competing with the title inside.
          Takes the container's own color (not the role's) so it never introduces a
          second color into the box; the soft fill is what sets it apart from the
          solid border line underneath. Needs `overflow-hidden` gone from the root —
          removed above — otherwise this gets clipped at the box edge. */}
      {data.role && (
        <span
          // z-20: above NodeResizer's z-10 line/handles (rendered when selected) —
          // otherwise the selection border line paints over this badge like a strikethrough.
          className="nodrag absolute left-4 top-0 z-20 -translate-y-1/2 rounded-full bg-background p-0.5"
          title={data.role.name}
        >
          <span
            className="flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: `${color}1F`, borderColor: color, color }}
          >
            <Shield className="h-2.5 w-2.5 shrink-0" />
            <span className="max-w-35 truncate">{data.role.name}</span>
          </span>
        </span>
      )}
      <div
        className={cn("flex w-full items-center gap-1.5 px-2 py-1 select-none cursor-move", data.role && "pt-2.5")}
        onDoubleClick={() => { if (!data.readOnly) setIsEditingTitle(true) }}
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
            className="nodrag min-w-0 flex-1 bg-transparent outline-none border-b border-dashed text-xs font-semibold"
            style={{ color }}
          />
        ) : (
          <span className="min-w-0 flex-1 truncate text-xs font-semibold" style={{ color }}>
            {data.content}
          </span>
        )}
      </div>
    </div>
  )

  if (data.readOnly) {
    return nodeContent
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{nodeContent}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {data.onRequestRolePick && (
          <ContextMenuItem
            className="hover:cursor-pointer"
            onClick={() => data.onRequestRolePick?.(data.id)}
          >
            <UserCog className="mr-2 h-4 w-4" />
            <span>{data.role ? t("node.changeRole") : t("node.assignRole")}</span>
          </ContextMenuItem>
        )}
        {data.role && data.onClearRole && (
          <ContextMenuItem
            className="hover:cursor-pointer"
            onClick={() => data.onClearRole?.(data.id)}
          >
            <UserX className="mr-2 h-4 w-4" />
            <span>{t("node.clearRole")}</span>
          </ContextMenuItem>
        )}
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
