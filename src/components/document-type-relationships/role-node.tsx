"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { Shield, Trash2, UserCog } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"
import type { CanvasElementNodeData } from "./text-node"

type RoleNodeType = Node<CanvasElementNodeData, "role">

const handleClass = "!w-3 !h-3 !border-2 !bg-background transition-colors hover:!bg-primary/20"
const handleReadOnlyClass = "!opacity-0 !pointer-events-none"

// Free-floating circle labeled with an RBAC role's name — the canvas equivalent of a
// BPMN lane actor, but not attached to any container. No inline text editing: the
// label always comes from the assigned role.
export function RoleNode({ data, selected }: NodeProps<RoleNodeType>) {
  const { t } = useTranslation("document-type-relationships")
  const color = data.color || "#6366f1"

  const nodeContent = (
    <div className="flex flex-col items-center gap-1 w-30">
      {/* Floating handles — mirrors asset-type-node.tsx: source on all 4 sides, always
          mounted (React Flow needs their handleBounds to position edges at all), made
          inert only in readOnly. With ConnectionMode.Loose these also accept incoming
          connections, so a role↔role or activo↔role edge can start from either side. */}
      <Handle type="source" position={Position.Top}    id="top"    isConnectable={!data.readOnly}
        className={cn(handleClass, data.readOnly && handleReadOnlyClass)} style={{ borderColor: color }}
      />
      <Handle type="source" position={Position.Right}  id="right"  isConnectable={!data.readOnly}
        className={cn(handleClass, data.readOnly && handleReadOnlyClass)} style={{ borderColor: color }}
      />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={!data.readOnly}
        className={cn(handleClass, data.readOnly && handleReadOnlyClass)} style={{ borderColor: color }}
      />
      <Handle type="source" position={Position.Left}   id="left"   isConnectable={!data.readOnly}
        className={cn(handleClass, data.readOnly && handleReadOnlyClass)} style={{ borderColor: color }}
      />
      <div
        className={cn(
          "flex items-center justify-center h-16 w-16 rounded-full border-2 shrink-0",
          "transition-shadow select-none",
          selected ? "shadow-md" : "",
        )}
        style={{ backgroundColor: `${color}26`, borderColor: color }}
      >
        {data.role ? (
          <Shield className="h-6 w-6" style={{ color }} />
        ) : (
          <UserCog className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <p className="text-xs font-medium text-center max-w-30 wrap-break-word select-none">
        {data.role?.name ?? data.content}
      </p>
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
          className="hover:cursor-pointer"
          onClick={() => data.onRequestRolePick?.(data.id)}
        >
          <UserCog className="mr-2 h-4 w-4" />
          <span>{t("node.changeRole")}</span>
        </ContextMenuItem>
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

export const MemoizedRoleNode = memo(RoleNode)
