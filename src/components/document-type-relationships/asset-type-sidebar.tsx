"use client"

import { useTranslation } from "react-i18next"
import { GripVertical, Shield, Square, Type } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { HuemulPanelHeader } from "@/huemul/components/huemul-panel-header"
import { cn } from "@/lib/utils"
import type { CanvasElementKind } from "@/types/document-type-relationships"
import type {
  AssetTypeSidebarProps,
  AssetTypeDraggableItemProps,
} from "@/types/document-type-relationships"

export function AssetTypeSidebar({
  items,
  isLoading,
  page,
  pageSize,
  search,
  onSearchChange,
  onSearchCommit,
  searchPlaceholder,
  canPickRole,
}: AssetTypeSidebarProps) {
  const { t } = useTranslation("document-type-relationships")

  const start = (page - 1) * pageSize
  const paginated = items.slice(start, start + pageSize)

  return (
    <div className="flex flex-col h-full border-r bg-muted/20">
      <div className="border-b shrink-0 py-2">
        <HuemulPanelHeader
          title={t("sidebar.title")}
          search={onSearchChange ? {
            value: search ?? "",
            onChange: onSearchChange,
            onCommit: onSearchCommit,
            placeholder: searchPlaceholder ?? t("header.searchPlaceholder"),
          } : undefined}
        />
      </div>

      {/* Free-standing canvas elements — container / text, dropped anywhere on the canvas */}
      <div className="p-2 space-y-1 border-b">
        <CanvasElementDraggableItem kind="container" icon={Square} label={t("sidebar.container")} />
        <CanvasElementDraggableItem kind="text" icon={Type} label={t("sidebar.text")} />
        {/* Gated solely on canPickRole (GET /rbac/roles permission) — the two
            document-type mode pages (/asset-types relations) never pass it, so this
            stays hidden there without needing a mode check of its own. */}
        {canPickRole && (
          <CanvasElementDraggableItem kind="role" icon={Shield} label={t("sidebar.role")} />
        )}
      </div>

      {/* Scrollable list */}
      <ScrollArea className="flex-1 min-h-0" type="hover">
        <div className="p-2 space-y-1">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
            ))
          ) : paginated.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              {t("sidebar.empty")}
            </p>
          ) : (
            paginated.map((item) => (
              <AssetTypeDraggableItem key={item.id} item={item} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function CanvasElementDraggableItem({
  kind,
  icon: Icon,
  label,
}: {
  kind: CanvasElementKind
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "copy"
    e.dataTransfer.setData("application/canvas-element", JSON.stringify({ kind }))
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md border border-dashed bg-background",
        "hover:bg-accent hover:cursor-grab active:cursor-grabbing",
        "transition-colors select-none",
      )}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs font-medium truncate flex-1">{label}</span>
    </div>
  )
}

function AssetTypeDraggableItem({ item }: AssetTypeDraggableItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "copy"
    e.dataTransfer.setData(
      "application/document-type",
      JSON.stringify({ id: item.id, name: item.name, color: item.color }),
    )
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md border bg-background",
        "hover:bg-accent hover:cursor-grab active:cursor-grabbing",
        "transition-colors select-none",
      )}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div
        className="h-3 w-3 rounded-full shrink-0"
        style={{ backgroundColor: item.color || "#94a3b8" }}
      />
      <span className="text-xs font-medium truncate flex-1">{item.name}</span>
      <Badge variant="secondary" className="text-[10px] h-4 px-1 shrink-0">
        {item.document_count ?? 0}
      </Badge>
    </div>
  )
}
