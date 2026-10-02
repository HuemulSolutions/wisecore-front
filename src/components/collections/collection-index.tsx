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
  ExternalLink,
  FilePlus2,
  FolderPlus,
  FolderInput,
  GripVertical,
  Home,
  House,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HuemulButton } from "@/huemul/components/huemul-button"
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
import { CollectionSubtree, SubCollectionHeader } from "./collection-subtree"

export interface CollectionIndexProps {
  detail: CollectionDetail
  /** null = portada (o las reglas, si `rulesSelected`). */
  selectedItemId: string | null
  onSelectCover: () => void
  /** Reglas generales como entrada propia del índice (`show_instructions_in_menu`). */
  showRules: boolean
  rulesSelected: boolean
  onSelectRules: () => void
  /** `true` = el ítem pasa a ser la portada; `false` = deja de serlo. */
  onSetHome: (item: CollectionItem, isHome: boolean) => void
  /** `collectionId`: la sub-colección del ítem, si no es de esta colección. */
  onSelectItem: (item: CollectionItem, collectionId?: string) => void
  /** Abre una sub-colección en su propia pantalla (allí se administra, si se puede). */
  onOpenCollection: (collectionId: string) => void
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
  /** `null` = sin grupo. */
  onAddItems: (groupId: string | null) => void
  /** Agregar sub-colecciones; `null` = sin grupo. */
  onAddCollections: (groupId: string | null) => void
}

// Un ítem del menú que abre un diálogo (o enfoca un input) espera a que el menú termine de
// cerrarse: si no, el foco que Radix devuelve al trigger compite con el del diálogo.
const afterMenuCloses = (action: () => void) => () => {
  setTimeout(action, 0)
}

const MENU_ITEM = "hover:cursor-pointer"
// Trigger de solo ícono que aparece al pasar el mouse: también al recibir foco por teclado.
const ROW_MENU_TRIGGER = "opacity-0 hover:cursor-pointer focus-visible:opacity-100 data-[state=open]:opacity-100"

function MoveAndRemoveMenuItems({ item, props }: { item: CollectionItem; props: CollectionIndexProps }) {
  const { t } = useTranslation("collections")
  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className={MENU_ITEM}>
          <FolderInput className="size-4" />
          {t("detail.moveToGroup")}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem className={MENU_ITEM} disabled={item.group_id === null} onSelect={() => props.onMoveToGroup(item, null)}>
            {t("detail.ungrouped")}
          </DropdownMenuItem>
          {props.detail.groups.map((group) => (
            <DropdownMenuItem
              key={group.id}
              className={MENU_ITEM}
              disabled={item.group_id === group.id}
              onSelect={() => props.onMoveToGroup(item, group.id)}
            >
              {group.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSeparator />
      <DropdownMenuItem className={cn("text-destructive", MENU_ITEM)} onSelect={afterMenuCloses(() => props.onRemoveItem(item))}>
        <Trash2 className="size-4" />
        {t("detail.removeItem")}
      </DropdownMenuItem>
    </>
  )
}

function DragHandle({ props, sortable }: { props: CollectionIndexProps; sortable: ReturnType<typeof useSortable> }) {
  const { t } = useTranslation("collections")
  if (!props.canManage) return <span className="w-2" />
  return (
    <button
      type="button"
      className="cursor-grab p-1 text-muted-foreground/60 hover:text-foreground"
      aria-label={t("detail.dragHint")}
      title={t("detail.dragHint")}
      {...sortable.attributes}
      {...sortable.listeners}
    >
      <GripVertical className="size-3.5" />
    </button>
  )
}

/**
 * Sub-colección en el índice: se ve como una carpeta y despliega su árbol debajo (solo lectura).
 * En la colección se mueve y se quita como cualquier ítem; su contenido se administra en su
 * propia pantalla.
 */
function ChildCollectionRow({
  row,
  props,
}: {
  row: Extract<CollectionIndexRow, { kind: "item" }>
  props: CollectionIndexProps
}) {
  const { t } = useTranslation("collections")
  const { item } = row
  const sortable = useSortable({ id: row.id, disabled: !props.canManage })
  const [expanded, setExpanded] = useState(false)
  const childId = item.child_collection_id!

  return (
    <li
      ref={sortable.setNodeRef}
      style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}
      className={cn("group/row rounded-md", sortable.isDragging && "z-10 opacity-60")}
    >
      <div className="flex items-center gap-1 pr-1">
        <DragHandle props={props} sortable={sortable} />
        <SubCollectionHeader
          name={item.collection?.name ?? item.title ?? ""}
          count={item.collection?.item_count}
          expanded={expanded}
          canExpand
          onToggle={() => setExpanded((value) => !value)}
          openLabel={t("detail.openCollection")}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-7 group-hover/row:opacity-100", ROW_MENU_TRIGGER)}
              aria-label={t("detail.moreActions")}
              title={t("detail.moreActions")}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className={MENU_ITEM} onSelect={() => props.onOpenCollection(childId)}>
              <ExternalLink className="size-4" />
              {item.collection?.can_admin ? t("detail.manageCollection") : t("detail.openCollection")}
            </DropdownMenuItem>
            {props.canManage && <MoveAndRemoveMenuItems item={item} props={props} />}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {expanded && (
        <CollectionSubtree
          collectionId={childId}
          level={1}
          ancestors={[props.detail.id, childId]}
          selectedItemId={props.selectedItemId}
          onSelectItem={props.onSelectItem}
          onOpenCollection={props.onOpenCollection}
        />
      )}
    </li>
  )
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
  // Se puede fijar la versión que se está viendo salvo que ya sea la fijada; también la oficial
  // vigente, para congelarla antes de que cambie.
  const canPinViewed =
    selected && !!props.viewedExecutionId && !(pinned && props.viewedExecutionId === item.version?.execution_id)

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
          title={t("detail.dragHint")}
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
        <span className={cn("w-full truncate text-sm", selected && "font-medium")} title={item.title ?? item.document_id ?? undefined}>
          {item.title ?? item.document_id}
        </span>
        <span className="flex w-full items-center gap-1 truncate text-xs text-muted-foreground">
          {pinned && (
            <span title={t("detail.pinned")} className="inline-flex shrink-0">
              <Pin className="size-3" aria-hidden="true" />
              <span className="sr-only">{t("detail.pinned")}</span>
            </span>
          )}
          {item.internal_code && (
            <span className="truncate" title={item.internal_code}>
              {item.internal_code}
            </span>
          )}
          {item.version ? (
            <span className="truncate" title={item.version.version ?? item.version.name ?? undefined}>
              · {item.version.version ?? item.version.name}
            </span>
          ) : (
            <span className="italic">· {t("detail.noVersion")}</span>
          )}
        </span>
      </button>
      {props.canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-7 group-hover/row:opacity-100", ROW_MENU_TRIGGER)}
              aria-label={t("detail.moreActions")}
              title={t("detail.moreActions")}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canPinViewed && (
              <DropdownMenuItem className={MENU_ITEM} onSelect={() => props.onPinVersion(item, props.viewedExecutionId)}>
                <Pin className="size-4" />
                {t("detail.pinCurrent")}
              </DropdownMenuItem>
            )}
            {pinned && (
              <DropdownMenuItem className={MENU_ITEM} onSelect={() => props.onPinVersion(item, null)}>
                <PinOff className="size-4" />
                {t("detail.usePublished")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className={MENU_ITEM} onSelect={() => props.onSetHome(item, !item.is_home)}>
              <House className="size-4" />
              {item.is_home ? t("detail.unsetCover") : t("detail.setAsCover")}
            </DropdownMenuItem>
            <MoveAndRemoveMenuItems item={item} props={props} />
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
        <span
          className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          title={group.name}
        >
          {group.name}
        </span>
      )}
      {props.canManage && !renaming && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-6 group-hover/head:opacity-100", ROW_MENU_TRIGGER)}
              aria-label={t("detail.moreActions")}
              title={t("detail.moreActions")}
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className={MENU_ITEM} onSelect={afterMenuCloses(() => props.onAddItems(group.id))}>
              <FilePlus2 className="size-4" />
              {t("detail.addItemsHere")}
            </DropdownMenuItem>
            <DropdownMenuItem className={MENU_ITEM} onSelect={afterMenuCloses(() => props.onAddCollections(group.id))}>
              <FolderPlus className="size-4" />
              {t("detail.addCollectionsHere")}
            </DropdownMenuItem>
            <DropdownMenuItem className={MENU_ITEM} onSelect={afterMenuCloses(() => setRenaming(true))}>
              <Pencil className="size-4" />
              {t("detail.renameGroup")}
            </DropdownMenuItem>
            <DropdownMenuItem className={MENU_ITEM} disabled={isFirst} onSelect={() => props.onMoveGroup(group, -1)}>
              <ArrowUp className="size-4" />
              {t("detail.moveGroupUp")}
            </DropdownMenuItem>
            <DropdownMenuItem className={MENU_ITEM} disabled={isLast} onSelect={() => props.onMoveGroup(group, 1)}>
              <ArrowDown className="size-4" />
              {t("detail.moveGroupDown")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={cn("text-destructive", MENU_ITEM)}
              onSelect={afterMenuCloses(() => props.onDeleteGroup(group))}
            >
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
 * Índice lateral de una colección: portada, reglas generales (si se muestran en el menú),
 * ítems sin grupo y cada grupo con sus ítems, en el orden que también recibe el agente. Un
 * ítem es un activo o una sub-colección, que se ve como una carpeta y despliega su árbol
 * debajo. El activo de portada no se repite en la lista, pero sigue en el orden que se guarda
 * (el reorden exige todos los ítems visibles y su posición importa para el agente). Quien
 * administra puede arrastrar ítems (también entre grupos), y crear, renombrar, mover y
 * borrar grupos.
 */
export function CollectionIndex(props: CollectionIndexProps) {
  const { t } = useTranslation("collections")
  const { detail } = props
  const rows = useMemo(() => buildIndexRows(detail.groups, detail.items), [detail.groups, detail.items])
  const visibleRows = useMemo(() => rows.filter((row) => !(row.kind === "item" && row.item.is_home)), [rows])
  const homeItem = detail.items.find((item) => item.is_home)
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
            props.selectedItemId === null && !props.rulesSelected && "bg-primary/10 font-medium",
          )}
        >
          <Home className="size-4 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-left">{t("detail.cover")}</span>
          {homeItem && props.canManage && (
            <span className="truncate text-xs font-normal text-muted-foreground" title={homeItem.title ?? undefined}>
              {homeItem.title}
            </span>
          )}
        </button>
        {props.showRules && (
          <button
            type="button"
            onClick={props.onSelectRules}
            className={cn(
              "mb-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:cursor-pointer hover:bg-muted",
              props.rulesSelected && "bg-primary/10 font-medium",
            )}
          >
            <ListChecks className="size-4 text-muted-foreground" />
            {t("detail.rules")}
          </button>
        )}
        {homeItem && props.canManage && (
          <div className="mb-2 flex items-center gap-1 pr-1">
            <span className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:cursor-pointer"
              onClick={() => props.onSetHome(homeItem, false)}
            >
              {t("detail.unsetCover")}
            </Button>
          </div>
        )}

        {rows.length === 0 ? (
          <p className="flex items-start gap-2 px-2 py-4 text-xs text-muted-foreground">
            <BookCopy className="size-4 shrink-0" />
            {t("detail.emptyIndex")}
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visibleRows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-0.5">
                {visibleRows.map((row) =>
                  row.kind === "item" ? (
                    row.item.kind === "collection" ? (
                      <ChildCollectionRow key={row.id} row={row} props={props} />
                    ) : (
                      <ItemRow key={row.id} row={row} props={props} />
                    )
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
              <HuemulButton
                variant="outline"
                size="sm"
                className="w-full justify-start"
                icon={FilePlus2}
                label={t("detail.addItems")}
                onClick={() => props.onAddItems(null)}
              />
              <HuemulButton
                variant="outline"
                size="sm"
                className="w-full justify-start"
                icon={FolderPlus}
                label={t("detail.addCollections")}
                onClick={() => props.onAddCollections(null)}
              />
              <HuemulButton
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                icon={Plus}
                label={t("detail.addGroup")}
                onClick={() => setNewGroup("")}
              />
            </div>
          )}
          {rows.some((row) => row.kind === "item") && <p className="px-1 text-[11px] text-muted-foreground">{t("detail.dragHint")}</p>}
        </div>
      )}
    </nav>
  )
}
