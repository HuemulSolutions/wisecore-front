"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronRight, ExternalLink, FileText, Folder, FolderOpen, Loader2, Pin } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { useCollection } from "@/hooks/useCollections"
import { cn } from "@/lib/utils"
import { COLLECTION_MAX_DEPTH, type CollectionItem } from "@/types/collections"
import { buildIndexRows } from "./collection-order"

// Sangría por nivel, como el árbol de carpetas (huemul-file-tree).
const INDENT_PX = 12

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
}

/**
 * Contenido de una sub-colección dentro del índice: activos y sub-colecciones en su orden, con
 * los grupos como separadores. Es de solo lectura (se administra en su propia pantalla).
 */
export function CollectionSubtree(props: CollectionSubtreeProps) {
  const { t } = useTranslation("collections")
  const { data, isLoading, isError } = useCollection(props.collectionId)
  const rows = useMemo(() => (data ? buildIndexRows(data.groups, data.items) : []), [data])
  const padding = { paddingLeft: props.level * INDENT_PX }

  if (isLoading) {
    return (
      <p className="flex items-center gap-1.5 py-1 text-xs text-muted-foreground" style={padding}>
        <Loader2 className="size-3 animate-spin" />
        {t("detail.loadingSubCollection")}
      </p>
    )
  }
  if (isError || !data) {
    return (
      <p className="py-1 text-xs italic text-muted-foreground" style={padding}>
        {t("detail.subCollectionUnavailable")}
      </p>
    )
  }

  return (
    <ul className="relative space-y-0.5 border-l border-border/60" style={{ marginLeft: props.level * INDENT_PX - 4 }}>
      {rows.length === 0 && data.hidden_item_count === 0 && (
        <li className="py-1 pl-3 text-xs italic text-muted-foreground">{t("detail.subCollectionEmpty")}</li>
      )}
      {rows.map((row) =>
        row.kind === "group" ? (
          <li
            key={row.id}
            className="truncate pl-3 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            title={row.group.name}
          >
            {row.group.name}
          </li>
        ) : row.item.kind === "collection" ? (
          <NestedCollectionRow key={row.id} item={row.item} props={props} />
        ) : (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => props.onSelectItem(row.item, props.collectionId)}
              className={cn(
                "flex w-full min-w-0 items-center gap-1.5 rounded-md py-1 pl-3 pr-1 text-left text-sm hover:cursor-pointer hover:bg-muted",
                props.selectedItemId === row.item.id && "bg-primary/10 font-medium",
              )}
            >
              <FileText className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate" title={row.item.title ?? undefined}>
                {row.item.title ?? row.item.document_id}
              </span>
              {row.item.version?.pinned && <Pin className="size-3 shrink-0 text-muted-foreground" aria-label={t("detail.pinned")} />}
            </button>
          </li>
        ),
      )}
      {data.hidden_item_count > 0 && (
        <li className="py-1 pl-3 text-xs italic text-muted-foreground">
          {t("detail.hiddenItems", { count: data.hidden_item_count })}
        </li>
      )}
    </ul>
  )
}

function NestedCollectionRow({ item, props }: { item: CollectionItem; props: CollectionSubtreeProps }) {
  const { t } = useTranslation("collections")
  const [expanded, setExpanded] = useState(false)
  const childId = item.child_collection_id!
  const canExpand = props.level < COLLECTION_MAX_DEPTH && !props.ancestors.includes(childId)

  return (
    <li>
      <SubCollectionHeader
        name={item.collection?.name ?? item.title ?? ""}
        count={item.collection?.item_count}
        expanded={expanded}
        canExpand={canExpand}
        onToggle={() => setExpanded((value) => !value)}
        onOpen={() => props.onOpenCollection(childId)}
        openLabel={t("detail.openCollection")}
        className="pl-3"
      />
      {expanded && canExpand && (
        <CollectionSubtree {...props} collectionId={childId} level={props.level + 1} ancestors={[...props.ancestors, childId]} />
      )}
    </li>
  )
}

/** Fila de una sub-colección: se ve como una carpeta (chevron + carpeta) y se abre en su pantalla. */
export function SubCollectionHeader({
  name,
  count,
  expanded,
  canExpand,
  onToggle,
  onOpen,
  openLabel,
  className,
}: {
  name: string
  count?: number
  expanded: boolean
  canExpand: boolean
  onToggle: () => void
  onOpen?: () => void
  openLabel: string
  className?: string
}) {
  const FolderIcon = expanded ? FolderOpen : Folder
  return (
    <div className={cn("group/sub flex min-w-0 flex-1 items-center gap-1 rounded-md pr-1 hover:bg-muted", className)}>
      <button
        type="button"
        onClick={onToggle}
        disabled={!canExpand}
        aria-expanded={expanded}
        className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left text-sm hover:cursor-pointer disabled:cursor-default"
      >
        <ChevronRight
          className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-90", !canExpand && "opacity-30")}
        />
        <FolderIcon className="size-3.5 shrink-0 text-blue-500" />
        <span className="min-w-0 flex-1 truncate" title={name}>
          {name}
        </span>
        {count !== undefined && <span className="shrink-0 text-xs text-muted-foreground">{count}</span>}
      </button>
      {onOpen && (
        <HuemulButton
          variant="ghost"
          size="icon"
          className="size-6 opacity-0 group-hover/sub:opacity-100 focus-visible:opacity-100"
          icon={ExternalLink}
          aria-label={openLabel}
          tooltip={openLabel}
          onClick={onOpen}
        />
      )}
    </div>
  )
}
