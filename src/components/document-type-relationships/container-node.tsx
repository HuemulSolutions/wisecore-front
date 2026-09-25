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
  const [hovered, setHovered] = useState(false)
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
        "relative h-full w-full rounded-2xl border border-dashed",
        "transition-shadow",
        selected ? "shadow-md" : "",
      )}
      style={{ borderColor: color, backgroundColor: "var(--diagram-container-fill)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!data.readOnly && (
        // isVisible en hover (no solo selected) permite redimensionar en un solo
        // gesto, sin clic previo. mouseleave del div raíz no dispara al entrar a
        // un descendiente, aunque el hit-area del handle sobresalga del borde
        // visual — por eso el hover se sostiene mientras se arrastra.
        <NodeResizer
          color={color}
          isVisible={selected || hovered}
          handleClassName={cn("z-10 huemul-resize-handle", !selected && "huemul-resize-handle--ghost")}
          lineClassName="z-10 huemul-resize-line"
          minWidth={120}
          minHeight={80}
        />
      )}
      <div
        className="flex w-full items-center gap-2 px-3 pt-2 pb-1 select-none cursor-move"
        onDoubleClick={() => { if (!data.readOnly) setIsEditingTitle(true) }}
      >
        <div className="min-w-0 flex-1">
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
              className="nodrag w-full min-w-0 bg-transparent outline-none border-b border-dashed text-[13px] font-semibold"
              style={{ color }}
            />
          ) : (
            <p className="min-w-0 truncate text-[13px] font-semibold" style={{ color }}>
              {data.content}
            </p>
          )}
        </div>
        {/* Role chip — mirror of RoleNode's pill, aligned to the header's right edge.
            Always índigo (the role palette), never the container's own color, so it
            reads as "role attached" regardless of the container's border color. Shows
            a neutral placeholder when no role is assigned instead of hiding entirely,
            so the header's shape doesn't shift when a role gets assigned/cleared. */}
        <span
          className={cn(
            "nodrag shrink-0 flex items-center gap-1 h-5.5 pl-1.5 pr-2.25 rounded-full border text-[11.5px] font-semibold",
            data.role
              ? "border-[var(--diagram-role-border)]"
              : "border-border bg-muted text-muted-foreground",
          )}
          style={
            data.role
              ? { backgroundColor: "var(--diagram-role-fill)", color: "var(--diagram-role-icon-bg)" }
              : undefined
          }
          title={data.role?.name}
        >
          <Shield className="h-2.75 w-2.75 shrink-0" />
          <span className="max-w-35 truncate">{data.role?.name ?? t("node.noRole")}</span>
        </span>
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
