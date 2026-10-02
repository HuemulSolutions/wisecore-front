"use client"

import { useMemo, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ChevronRight, Loader2, MoreHorizontal, Pencil, Pin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useCollection } from "@/hooks/useCollections"
import { cn } from "@/lib/utils"
import { COLLECTION_MAX_DEPTH, type CollectionItem } from "@/types/collections"
import { buildIndexRows, visibleIndexRows } from "./collection-order"

// Un nivel más adentro, con una guía vertical que marca dónde empieza y termina: la llevan los
// ítems de un grupo y el contenido de una sub-colección. Es padding (no margen vertical) para que
// la guía no se corte entre filas.
export const GROUPED_ROW = "ml-3 border-l border-border pl-2"
// Trigger de solo ícono que aparece al pasar el mouse: también al recibir foco por teclado.
export const ROW_MENU_TRIGGER = "opacity-0 hover:cursor-pointer focus-visible:opacity-100 data-[state=open]:opacity-100"

/**
 * Encabezado del índice: lo usan los grupos y las sub-colecciones, que se ven igual. El
 * chevron colapsa o expande lo que cuelga debajo.
 */
export function IndexHeading({
  name,
  collapsed,
  onToggle,
  dragHandle,
  menu,
  className,
}: {
  name: string
  collapsed: boolean
  onToggle: () => void
  dragHandle?: ReactNode
  menu?: ReactNode
  className?: string
}) {
  const { t } = useTranslation("collections")
  return (
    <div className={cn("group/head flex min-w-0 items-center gap-1 border-b pb-1", className)}>
      {dragHandle}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        title={collapsed ? t("detail.expandGroup") : t("detail.collapseGroup")}
        className="flex min-w-0 flex-1 items-center gap-1 text-left hover:cursor-pointer"
      >
        <ChevronRight
          className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", !collapsed && "rotate-90")}
        />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground" title={name}>
          {name}
        </span>
      </button>
      {menu}
    </div>
  )
}

/**
 * Contenido de la fila de un activo, igual en la colección y en sus sub-colecciones: el título y,
 * debajo, versión fija, código interno y versión.
 */
export function AssetRowLabel({ item, selected }: { item: CollectionItem; selected: boolean }) {
  const { t } = useTranslation("collections")
  const pinned = item.version?.pinned ?? false
  return (
    <>
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
    </>
  )
}

/** Menú ⋯ de una sub-colección: "Editar colección" (si la administra) y lo que agregue el padre. */
export function EditCollectionMenu({ onEdit, children }: { onEdit?: () => void; children?: ReactNode }) {
  const { t } = useTranslation("collections")
  if (!onEdit && !children) return null
  return (
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
        {onEdit && (
          <DropdownMenuItem className="hover:cursor-pointer" onSelect={onEdit}>
            <Pencil className="size-4" />
            {t("detail.editCollection")}
          </DropdownMenuItem>
        )}
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export interface CollectionSubtreeProps {
  /** Sub-colección a mostrar. Su contenido se pide con su propio detalle: el backend aplica
   * los permisos de quien mira en este nivel. */
  collectionId: string
  /** Nivel de la sub-colección (la colección de la pantalla es el 1). */
  level: number
  /** Colecciones ya abiertas en esta rama: no se vuelve a abrir una (defensa ante datos raros). */
  ancestors: string[]
  selectedItemId: string | null
  onSelectItem: (item: CollectionItem, collectionId: string) => void
  onOpenCollection: (collectionId: string) => void
  /** Ids colapsados (grupos e ítems de sub-colección), compartidos con el índice. */
  collapsed: Set<string>
  onToggleCollapsed: (id: string) => void
}

/**
 * Contenido de una sub-colección dentro del índice: activos, grupos y sub-colecciones en su
 * orden, colapsables. Es de solo lectura (se administra en su propia pantalla).
 */
export function CollectionSubtree(props: CollectionSubtreeProps) {
  const { t } = useTranslation("collections")
  const { data, isLoading, isError } = useCollection(props.collectionId)
  const rows = useMemo(
    () => (data ? visibleIndexRows(buildIndexRows(data.groups, data.items), props.collapsed) : []),
    [data, props.collapsed],
  )

  if (isLoading) {
    return (
      <p className={cn("flex items-center gap-1.5 py-1 text-xs text-muted-foreground", GROUPED_ROW)}>
        <Loader2 className="size-3 animate-spin" />
        {t("detail.loadingSubCollection")}
      </p>
    )
  }
  if (isError || !data) {
    return (
      <p className={cn("py-1 text-xs italic text-muted-foreground", GROUPED_ROW)}>
        {t("detail.subCollectionUnavailable")}
      </p>
    )
  }

  return (
    <ul className={cn("pt-0.5", GROUPED_ROW)}>
      {rows.length === 0 && data.hidden_item_count === 0 && (
        <li className="py-1 text-xs italic text-muted-foreground">{t("detail.subCollectionEmpty")}</li>
      )}
      {rows.map((row) =>
        row.kind === "group" ? (
          <li key={row.id} className="pt-2">
            <IndexHeading
              name={row.group.name}
              collapsed={props.collapsed.has(row.id)}
              onToggle={() => props.onToggleCollapsed(row.id)}
            />
          </li>
        ) : row.item.kind === "collection" ? (
          <NestedCollectionRow key={row.id} item={row.item} props={props} />
        ) : (
          <li key={row.id} className={cn(row.item.group_id && GROUPED_ROW)}>
            <button
              type="button"
              onClick={() => props.onSelectItem(row.item, props.collectionId)}
              className={cn(
                "flex w-full min-w-0 flex-col items-start rounded-md px-2 py-1.5 text-left hover:cursor-pointer hover:bg-muted",
                props.selectedItemId === row.item.id && "bg-primary/10",
              )}
            >
              <AssetRowLabel item={row.item} selected={props.selectedItemId === row.item.id} />
            </button>
          </li>
        ),
      )}
      {data.hidden_item_count > 0 && (
        <li className="py-1 text-xs italic text-muted-foreground">
          {t("detail.hiddenItems", { count: data.hidden_item_count })}
        </li>
      )}
    </ul>
  )
}

function NestedCollectionRow({ item, props }: { item: CollectionItem; props: CollectionSubtreeProps }) {
  const childId = item.child_collection_id!
  const collapsed = props.collapsed.has(item.id)
  const canExpand = props.level < COLLECTION_MAX_DEPTH && !props.ancestors.includes(childId)

  return (
    <li className={cn("pt-2", item.group_id && GROUPED_ROW)}>
      <IndexHeading
        name={item.collection?.name ?? item.title ?? ""}
        collapsed={collapsed || !canExpand}
        onToggle={() => canExpand && props.onToggleCollapsed(item.id)}
        menu={<EditCollectionMenu onEdit={item.collection?.can_admin ? () => props.onOpenCollection(childId) : undefined} />}
      />
      {!collapsed && canExpand && (
        <CollectionSubtree {...props} collectionId={childId} level={props.level + 1} ancestors={[...props.ancestors, childId]} />
      )}
    </li>
  )
}
