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
  type DragStartEvent,
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  BookCopy,
  FilePlus2,
  FolderInput,
  GripVertical,
  Home,
  House,
  Library,
  ListChecks,
  ListPlus,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
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
import { useOrganization } from "@/contexts/organization-context"
import { cn } from "@/lib/utils"
import type { CollectionDetail, CollectionGroup, CollectionItem } from "@/types/collections"
import {
  buildIndexRows,
  moveGroupRow,
  moveIndexRow,
  toOrderEntries,
  visibleIndexRows,
  type CollectionIndexRow,
} from "./collection-order"
import {
  AssetRowLabel,
  CollectionSubtree,
  EditCollectionMenu,
  GROUPED_ROW,
  IndexHeading,
  ROW_MENU_TRIGGER,
} from "./collection-subtree"
import { useCollapsedSet } from "./use-collapsed-set"

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
  /** Orden nuevo de todos los grupos (al arrastrar un encabezado). */
  onReorderGroups: (groupIds: string[]) => void
  onPinVersion: (item: CollectionItem, executionId: string | null) => void
  onMoveToGroup: (item: CollectionItem, groupId: string | null) => void
  onRemoveItem: (item: CollectionItem) => void
  onCreateGroup: (name: string) => void
  onRenameGroup: (group: CollectionGroup, name: string) => void
  onDeleteGroup: (group: CollectionGroup) => void
  /** `null` = sin grupo. */
  onAddItems: (groupId: string | null) => void
  /** Agregar sub-colecciones; `null` = sin grupo. */
  onAddCollections: (groupId: string | null) => void
}

interface CollapseState {
  collapsed: Set<string>
  toggle: (id: string) => void
}

// Un ítem del menú que abre un diálogo (o enfoca un input) espera a que el menú termine de
// cerrarse: si no, el foco que Radix devuelve al trigger compite con el del diálogo.
const afterMenuCloses = (action: () => void) => () => {
  setTimeout(action, 0)
}

const MENU_ITEM = "hover:cursor-pointer"

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

function DragHandle({ sortable }: { sortable: ReturnType<typeof useSortable> }) {
  const { t } = useTranslation("collections")
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
 * Sub-colección en el índice: se ve igual que un grupo (encabezado colapsable) y debajo va su
 * contenido, de solo lectura. En la colección se arrastra, se mueve y se quita como cualquier
 * ítem; su contenido se edita en su propia pantalla ("Editar colección", si la administra).
 */
function ChildCollectionRow({
  row,
  props,
  collapse,
}: {
  row: Extract<CollectionIndexRow, { kind: "item" }>
  props: CollectionIndexProps
  collapse: CollapseState
}) {
  const { item } = row
  const sortable = useSortable({ id: row.id, disabled: !props.canManage })
  const childId = item.child_collection_id!
  const collapsed = collapse.collapsed.has(item.id)

  return (
    <li
      ref={sortable.setNodeRef}
      style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}
      className={cn("pt-3", item.group_id && GROUPED_ROW, sortable.isDragging && "z-10 opacity-60")}
    >
      <IndexHeading
        name={item.collection?.name ?? item.title ?? ""}
        collapsed={collapsed}
        onToggle={() => collapse.toggle(item.id)}
        className={props.canManage ? undefined : "pl-2"}
        dragHandle={props.canManage ? <DragHandle sortable={sortable} /> : undefined}
        menu={
          <EditCollectionMenu onEdit={item.collection?.can_admin ? () => props.onOpenCollection(childId) : undefined}>
            {props.canManage ? <MoveAndRemoveMenuItems item={item} props={props} /> : null}
          </EditCollectionMenu>
        }
      />
      {!collapsed && (
        <CollectionSubtree
          collectionId={childId}
          level={2}
          ancestors={[props.detail.id, childId]}
          selectedItemId={props.selectedItemId}
          onSelectItem={props.onSelectItem}
          onOpenCollection={props.onOpenCollection}
          collapsed={collapse.collapsed}
          onToggleCollapsed={collapse.toggle}
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
  const sortable = useSortable({ id: row.id, disabled: !props.canManage })
  const selected = props.selectedItemId === item.id
  const pinned = item.version?.pinned ?? false
  // Se puede fijar la versión que se está viendo salvo que ya sea la fijada; también la oficial
  // vigente, para congelarla antes de que cambie.
  const canPinViewed =
    selected && !!props.viewedExecutionId && !(pinned && props.viewedExecutionId === item.version?.execution_id)

  return (
    <li
      ref={sortable.setNodeRef}
      style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}
      className={cn(
        "group/row flex items-center gap-1 pr-1",
        item.group_id ? GROUPED_ROW : "rounded-md",
        sortable.isDragging && "z-10 opacity-60",
        selected && "bg-primary/10",
      )}
    >
      {props.canManage ? <DragHandle sortable={sortable} /> : <span className="w-2" />}
      <button
        type="button"
        onClick={() => props.onSelectItem(item)}
        className="flex min-w-0 flex-1 flex-col items-start py-1.5 text-left hover:cursor-pointer"
      >
        <AssetRowLabel item={item} selected={selected} />
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

/** Encabezado de grupo: colapsable y, para quien administra, arrastrable con todo su bloque. */
function GroupRow({
  row,
  props,
  collapse,
}: {
  row: Extract<CollectionIndexRow, { kind: "group" }>
  props: CollectionIndexProps
  collapse: CollapseState
}) {
  const { t } = useTranslation("collections")
  const { group } = row
  // También es zona de destino: soltar un activo sobre el encabezado lo mete en el grupo.
  const sortable = useSortable({ id: row.id, disabled: !props.canManage })
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(group.name)

  return (
    <li
      ref={sortable.setNodeRef}
      style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}
      className={cn("mt-3", sortable.isDragging && "z-10 opacity-60")}
    >
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
        <IndexHeading
          name={group.name}
          collapsed={collapse.collapsed.has(row.id)}
          onToggle={() => collapse.toggle(row.id)}
          className={props.canManage ? undefined : "pl-2"}
          dragHandle={props.canManage ? <DragHandle sortable={sortable} /> : undefined}
          menu={
            props.canManage ? (
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
                    <Library className="size-4" />
                    {t("detail.addCollectionsHere")}
                  </DropdownMenuItem>
                  <DropdownMenuItem className={MENU_ITEM} onSelect={afterMenuCloses(() => setRenaming(true))}>
                    <Pencil className="size-4" />
                    {t("detail.renameGroup")}
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
            ) : undefined
          }
        />
      )}
    </li>
  )
}

/**
 * Índice lateral de una colección: portada, reglas generales (si se muestran en el menú),
 * ítems sin grupo y cada grupo con sus ítems, en el orden que también recibe el agente. Un
 * ítem es un activo o una sub-colección, que se ve igual que un grupo y despliega su contenido
 * debajo. Grupos y sub-colecciones se colapsan (se recuerda en este navegador). El activo de
 * portada no se repite en la lista, pero sigue en el orden que se guarda (el reorden exige todos
 * los ítems visibles y su posición importa para el agente). Quien administra arrastra activos,
 * sub-colecciones y grupos, y crea, renombra y borra grupos.
 */
export function CollectionIndex(props: CollectionIndexProps) {
  const { t } = useTranslation("collections")
  const { detail } = props
  const { selectedOrganizationId } = useOrganization()
  const collapse = useCollapsedSet(`collections:collapsed:${selectedOrganizationId ?? ""}:${detail.id}`)
  // Mientras se arrastra un grupo se ve colapsado: así el bloque se lee como uno.
  const [draggingGroup, setDraggingGroup] = useState<string | null>(null)
  const rows = useMemo(() => buildIndexRows(detail.groups, detail.items), [detail.groups, detail.items])
  const visibleRows = useMemo(() => {
    const collapsed = draggingGroup ? new Set([...collapse.collapsed, draggingGroup]) : collapse.collapsed
    return visibleIndexRows(rows, collapsed).filter((row) => !(row.kind === "item" && row.item.is_home))
  }, [rows, collapse.collapsed, draggingGroup])
  const homeItem = detail.items.find((item) => item.is_home)
  const [newGroup, setNewGroup] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const handleDragStart = ({ active }: DragStartEvent) => {
    const id = String(active.id)
    if (rows.some((row) => row.kind === "group" && row.id === id)) setDraggingGroup(id)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggingGroup(null)
    if (!over || active.id === over.id) return
    const activeId = String(active.id)
    const overId = String(over.id)
    if (rows.some((row) => row.kind === "group" && row.id === activeId)) {
      const groupIds = moveGroupRow(rows, activeId, overId)
      if (groupIds) props.onReorderGroups(groupIds)
      return
    }
    const next = moveIndexRow(rows, activeId, overId)
    if (next !== rows) props.onReorder(toOrderEntries(next))
  }

  const coverSelected = props.selectedItemId === null && !props.rulesSelected

  return (
    <nav aria-label={t("detail.index")} className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-2">
        <div
          className={cn(
            "group/row mb-2 flex items-center gap-1 rounded-md pr-1 hover:bg-muted",
            coverSelected && "bg-primary/10",
          )}
        >
          <button
            type="button"
            onClick={props.onSelectCover}
            className="flex min-w-0 flex-1 items-start gap-2 px-2 py-1.5 text-left hover:cursor-pointer"
          >
            <Home className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className={cn("text-sm", coverSelected && "font-medium")}>{t("detail.cover")}</span>
              {homeItem && (
                <span className="truncate text-xs text-muted-foreground" title={homeItem.title ?? undefined}>
                  {homeItem.title}
                </span>
              )}
            </span>
          </button>
          {homeItem && props.canManage && (
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
                <DropdownMenuItem className={MENU_ITEM} onSelect={() => props.onSetHome(homeItem, false)}>
                  <House className="size-4" />
                  {t("detail.unsetCover")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
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

        {rows.length === 0 ? (
          <p className="flex items-start gap-2 px-2 py-4 text-xs text-muted-foreground">
            <BookCopy className="size-4 shrink-0" />
            {t("detail.emptyIndex")}
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragCancel={() => setDraggingGroup(null)}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={visibleRows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
              <ul>
                {visibleRows.map((row) =>
                  row.kind === "item" ? (
                    row.item.kind === "collection" ? (
                      <ChildCollectionRow key={row.id} row={row} props={props} collapse={collapse} />
                    ) : (
                      <ItemRow key={row.id} row={row} props={props} />
                    )
                  ) : (
                    <GroupRow key={row.id} row={row} props={props} collapse={collapse} />
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
            <AddButtons
              onAddItems={() => props.onAddItems(null)}
              onAddCollections={() => props.onAddCollections(null)}
              onAddGroup={() => setNewGroup("")}
            />
          )}
          {rows.some((row) => row.kind === "item") && <p className="px-1 text-[11px] text-muted-foreground">{t("detail.dragHint")}</p>}
        </div>
      )}
    </nav>
  )
}

/** Agregar activos, colecciones o un grupo: tres botones de ícono en fila, cada uno con su tooltip. */
export function AddButtons({
  onAddItems,
  onAddCollections,
  onAddGroup,
  className,
}: {
  onAddItems: () => void
  onAddCollections: () => void
  onAddGroup?: () => void
  className?: string
}) {
  const { t } = useTranslation("collections")
  const buttons = [
    { icon: FilePlus2, label: t("detail.addItems"), onClick: onAddItems },
    { icon: Library, label: t("detail.addCollections"), onClick: onAddCollections },
    ...(onAddGroup ? [{ icon: ListPlus, label: t("detail.addGroup"), onClick: onAddGroup }] : []),
  ]
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {buttons.map(({ icon, label, onClick }) => (
        <HuemulButton
          key={label}
          variant="outline"
          size="icon"
          className="size-8"
          icon={icon}
          aria-label={label}
          tooltip={label}
          onClick={onClick}
        />
      ))}
    </div>
  )
}
