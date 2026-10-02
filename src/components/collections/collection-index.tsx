"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowDown,
  ArrowUp,
  BookCopy,
  FilePlus2,
  FolderInput,
  GripVertical,
  Home,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { CollectionDetail, CollectionGroup, CollectionItem } from "@/types/collections"
import { buildIndexRows, moveIndexRow, toOrderEntries, type CollectionIndexRow } from "./collection-order"

export interface CollectionIndexProps {
  detail: CollectionDetail
  /** null = portada. */
  selectedItemId: string | null
  onSelectCover: () => void
  onSelectItem: (item: CollectionItem) => void
  /** Versión que se está viendo del ítem seleccionado (para "fijar esta versión"). */
  viewedExecutionId: string | null
  canManage: boolean
  onReorder: (rows: ReturnType<typeof toOrderEntries>) => void
  onPinVersion: (item: CollectionItem, executionId: string | null) => void
  onMoveToGroup: (item: CollectionItem, groupId: string | null) => void
  onRemoveItem: (item: CollectionItem) => void
  onCreateGroup: (name: string) => void
  onRenameGroup: (group: CollectionGroup, name: string) => void
  onMoveGroup: (group: CollectionGroup, delta: -1 | 1) => void
  onDeleteGroup: (group: CollectionGroup) => void
  onAddItems: () => void
}

function ItemRow({
  row,
  props,
}: {
  row: Extract<CollectionIndexRow, { kind: "item" }>
  props: CollectionIndexProps
}) {
  const { t } = useTranslation("collections")
  const { item } = row
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled: !props.canManage,
  })
  const selected = props.selectedItemId === item.id
  const pinned = item.version?.pinned ?? false
  const canPinViewed =
    selected && !!props.viewedExecutionId && props.viewedExecutionId !== item.version?.execution_id

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("group/row flex items-center gap-1 rounded-md pr-1", isDragging && "z-10 opacity-60", selected && "bg-primary/10")}
    >
      {props.canManage ? (
        <button
          type="button"
          className="cursor-grab p-1 text-muted-foreground/60 hover:text-foreground"
          aria-label={t("detail.dragHint")}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>
      ) : (
        <span className="w-2" />
      )}
      <button
        type="button"
        onClick={() => props.onSelectItem(item)}
        className="flex min-w-0 flex-1 flex-col items-start py-1.5 text-left hover:cursor-pointer"
      >
        <span className={cn("w-full truncate text-sm", selected && "font-medium")}>{item.title ?? item.document_id}</span>
        <span className="flex w-full items-center gap-1 truncate text-xs text-muted-foreground">
          {pinned && <Pin className="size-3 shrink-0" aria-label={t("detail.pinned")} />}
          {item.internal_code && <span className="truncate">{item.internal_code}</span>}
          {item.version ? (
            <span className="truncate">· {item.version.version ?? item.version.name}</span>
          ) : (
            <span className="italic">· {t("detail.noVersion")}</span>
          )}
        </span>
      </button>
      {props.canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover/row:opacity-100 data-[state=open]:opacity-100">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canPinViewed && (
              <DropdownMenuItem onSelect={() => props.onPinVersion(item, props.viewedExecutionId)}>
                <Pin className="size-4" />
                {t("detail.pinCurrent")}
              </DropdownMenuItem>
            )}
            {pinned && (
              <DropdownMenuItem onSelect={() => props.onPinVersion(item, null)}>
                <PinOff className="size-4" />
                {t("detail.usePublished")}
              </DropdownMenuItem>
            )}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderInput className="size-4" />
                {t("detail.moveToGroup")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem disabled={item.group_id === null} onSelect={() => props.onMoveToGroup(item, null)}>
                  {t("detail.ungrouped")}
                </DropdownMenuItem>
                {props.detail.groups.map((group) => (
                  <DropdownMenuItem
                    key={group.id}
                    disabled={item.group_id === group.id}
                    onSelect={() => props.onMoveToGroup(item, group.id)}
                  >
                    {group.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onSelect={() => props.onRemoveItem(item)}>
              <Trash2 className="size-4" />
              {t("detail.removeItem")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  )
}

function GroupRow({
  row,
  index,
  props,
}: {
  row: Extract<CollectionIndexRow, { kind: "group" }>
  index: number
  props: CollectionIndexProps
}) {
  const { t } = useTranslation("collections")
  const { group } = row
  // El encabezado es zona de destino (soltar un activo lo mete en el grupo), no se arrastra.
  const { setNodeRef } = useSortable({ id: row.id, disabled: { draggable: true, droppable: false } })
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(group.name)
  const isFirst = index === 0
  const isLast = index === props.detail.groups.length - 1

  return (
    <li ref={setNodeRef} className="group/head mt-3 flex items-center gap-1 border-b pb-1 pl-2">
      {renaming ? (
        <Input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => {
            setRenaming(false)
            if (name.trim() && name.trim() !== group.name) props.onRenameGroup(group, name.trim())
            else setName(group.name)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur()
            if (event.key === "Escape") {
              setName(group.name)
              setRenaming(false)
            }
          }}
          className="h-7 text-xs"
          aria-label={t("detail.groupName")}
        />
      ) : (
        <span className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {group.name}
        </span>
      )}
      {props.canManage && !renaming && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover/head:opacity-100 data-[state=open]:opacity-100">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setRenaming(true)}>
              <Pencil className="size-4" />
              {t("detail.renameGroup")}
            </DropdownMenuItem>
            <DropdownMenuItem disabled={isFirst} onSelect={() => props.onMoveGroup(group, -1)}>
              <ArrowUp className="size-4" />
              {t("detail.moveGroupUp")}
            </DropdownMenuItem>
            <DropdownMenuItem disabled={isLast} onSelect={() => props.onMoveGroup(group, 1)}>
              <ArrowDown className="size-4" />
              {t("detail.moveGroupDown")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onSelect={() => props.onDeleteGroup(group)}>
              <Trash2 className="size-4" />
              {t("detail.deleteGroup")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  )
}

/**
 * Índice lateral de una colección: portada, activos sin grupo y cada grupo con
 * sus activos, en el orden que también recibe el agente. Quien administra puede
 * arrastrar activos (también entre grupos), y crear, renombrar, mover y borrar
 * grupos.
 */
export function CollectionIndex(props: CollectionIndexProps) {
  const { t } = useTranslation("collections")
  const { detail } = props
  const rows = useMemo(() => buildIndexRows(detail.groups, detail.items), [detail.groups, detail.items])
  const [newGroup, setNewGroup] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const next = moveIndexRow(rows, String(active.id), String(over.id))
    if (next !== rows) props.onReorder(toOrderEntries(next))
  }

  const groupIndex = new Map(detail.groups.map((group, index) => [group.id, index]))

  return (
    <nav aria-label={t("detail.index")} className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-2">
        <button
          type="button"
          onClick={props.onSelectCover}
          className={cn(
            "mb-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:cursor-pointer hover:bg-muted",
            props.selectedItemId === null && "bg-primary/10 font-medium",
          )}
        >
          <Home className="size-4 text-muted-foreground" />
          {t("detail.cover")}
        </button>

        {rows.length === 0 ? (
          <p className="flex items-start gap-2 px-2 py-4 text-xs text-muted-foreground">
            <BookCopy className="size-4 shrink-0" />
            {t("detail.emptyIndex")}
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={rows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-0.5">
                {rows.map((row) =>
                  row.kind === "item" ? (
                    <ItemRow key={row.id} row={row} props={props} />
                  ) : (
                    <GroupRow key={row.id} row={row} index={groupIndex.get(row.group.id) ?? 0} props={props} />
                  ),
                )}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        {detail.hidden_item_count > 0 && (
          <p className="mt-3 px-2 text-xs italic text-muted-foreground">
            {t("detail.hiddenItems", { count: detail.hidden_item_count })}
          </p>
        )}
      </div>

      {props.canManage && (
        <div className="space-y-2 border-t p-2">
          {newGroup !== null ? (
            <Input
              autoFocus
              value={newGroup}
              placeholder={t("detail.groupName")}
              onChange={(event) => setNewGroup(event.target.value)}
              onBlur={() => {
                if (newGroup.trim()) props.onCreateGroup(newGroup.trim())
                setNewGroup(null)
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur()
                if (event.key === "Escape") setNewGroup(null)
              }}
              className="h-8 text-sm"
            />
          ) : (
            <div className="flex flex-col gap-1">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={props.onAddItems}>
                <FilePlus2 className="size-4" />
                {t("detail.addItems")}
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setNewGroup("")}>
                <Plus className="size-4" />
                {t("detail.addGroup")}
              </Button>
            </div>
          )}
          {rows.some((row) => row.kind === "item") && <p className="px-1 text-[11px] text-muted-foreground">{t("detail.dragHint")}</p>}
        </div>
      )}
    </nav>
  )
}
