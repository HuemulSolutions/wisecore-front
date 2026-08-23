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

// Distinct from a container's role count: 'none' also covers a role node whose role
// was never assigned yet (data.role undefined) — both render as "Sin asignar".
export type RoleNodeMeta = { kind: "containers"; count: number } | { kind: "none" }

type RoleNodeType = Node<CanvasElementNodeData & { roleMeta?: RoleNodeMeta }, "role">

const handleClass =
  "!w-1.75 !h-1.75 !border-[1.5px] !border-[var(--diagram-role-edge)] !bg-white transition-colors hover:!bg-[var(--diagram-role-fill)]"
const handleReadOnlyClass = "!opacity-0 !pointer-events-none"

// Horizontal pill labeled with an RBAC role's name — reads as a distinct entity type
// (vs. the white asset card and the dashed container) without outweighing them
// visually. No inline text editing: the label always comes from the assigned role.
export function RoleNode({ data, selected }: NodeProps<RoleNodeType>) {
  const { t } = useTranslation("document-type-relationships")

  const metaLabel =
    data.roleMeta?.kind === "containers" && data.roleMeta.count > 0
      ? t("node.roleAssignedCount", { count: data.roleMeta.count })
      : t("node.roleUnassigned")

  const nodeContent = (
    <div
      className={cn(
        "relative flex items-center gap-2.5 w-60 h-14 rounded-full pl-2.5 pr-4",
        "bg-[var(--diagram-role-fill)] border transition-shadow select-none",
        selected
          ? "border-[1.5px] border-[var(--diagram-role-icon-bg)]"
          : "border-[var(--diagram-role-border)] hover:border-[var(--diagram-role-icon-bg)]/60 hover:shadow-[0_2px_8px_rgba(79,70,229,0.14)]",
      )}
    >
      {/* Floating handles — mirrors asset-type-node.tsx: source on all 4 sides, always
          mounted (React Flow needs their handleBounds to position edges at all), made
          inert only in readOnly. With ConnectionMode.Loose these also accept incoming
          connections, so a role↔role or activo↔role edge can start from either side. */}
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

      <div
        className="flex items-center justify-center h-7.5 w-7.5 rounded-full shrink-0"
        style={{ backgroundColor: "var(--diagram-role-icon-bg)" }}
      >
        {data.role ? (
          <Shield className="h-3.75 w-3.75 text-white" strokeWidth={2} />
        ) : (
          <UserCog className="h-3.75 w-3.75 text-white/80" strokeWidth={2} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-[13.5px] font-semibold truncate"
          style={{ color: "var(--diagram-role-title)" }}
        >
          {data.role?.name ?? data.content}
        </p>
        <p
          className="text-[11.5px] truncate"
          style={{ color: "var(--diagram-role-meta)" }}
        >
          {metaLabel}
        </p>
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
