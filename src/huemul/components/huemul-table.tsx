import * as React from "react"
import { MoreVertical, Inbox, ArrowUp, ArrowDown, ChevronsUpDown, AlertCircle, RefreshCw, Loader2, ChevronRight, Folder, Pencil, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { getErrorMessage } from "@/lib/error-utils"
import type {
  HuemulTableActionsMode,
  HuemulTableColumn,
  HuemulTableAction,
  HuemulTableActionItem,
  HuemulTableEmptyState,
  HuemulTablePagination,
  HuemulTableProps,
  HuemulTableFolder,
  HuemulTableFolders,
} from "@/types/huemul"

export type {
  HuemulTableActionsMode,
  HuemulTableColumn,
  HuemulTableAction,
  HuemulTableActionItem,
  HuemulTableEmptyState,
  HuemulTablePagination,
  HuemulTableProps,
  HuemulTableFolder,
  HuemulTableFolders,
}
import {
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { HuemulButton } from "./huemul-button"
import { HuemulPagination } from "./huemul-pagination"
import { FolderNameCell, FolderCreateForm, InsertFolderStrip, AddFolderRow, EmptyFolderHint } from "./huemul-table-folder-parts"
import { useColumnWidths } from "@/hooks/useColumnWidths"
import { useTableFolderDrag } from "@/hooks/useTableFolderDrag"
import { useTranslation } from "react-i18next"

// ── Constantes de redimensionado ─────────────────────────────────────────────
const MIN_COL_WIDTH = 80
const ACTIONS_COL_WIDTH = 100
const SELECT_COL_WIDTH = 48
const EXPAND_COL_WIDTH = 40

// ── Soporte de carpetas (prop `folders`, opt-in) ─────────────────────────────
// Ver ia context/tabla-agrupada-drag-and-drop-guide.md para el patrón completo.

type RenderRow<T> =
  | { kind: "folder"; folder: HuemulTableFolder; topIndex: number; open: boolean; count: number; childKeys: string[] }
  | { kind: "item"; item: T; key: string; folderId: string | null; topIndex: number }
  | { kind: "empty-folder"; folder: HuemulTableFolder }

type DisplayRow<T> = RenderRow<T> | { kind: "create-form" }

export interface HuemulTableHandle {
  /**
   * Abre el formulario de creación de carpeta en el ancla por defecto: fin del bloque
   * de carpetas (si `foldersFirst !== false`) o fin de la raíz. No-op sin `folders`.
   */
  startCreateFolder: () => void
}

// Fondos opacos para la celda sticky de acciones/columna fijada — nunca alpha (`bg-x/5`)
// ahí: con scroll horizontal necesita tapar el contenido que pasa por debajo. Las dos
// primeras ramas son las que ya existían antes de `folders` (ver comentario más abajo).
function stickyBg(kind: "default" | "selected" | "dropTarget" | "folder" | "child"): string {
  switch (kind) {
    case "selected":
      return "bg-[color-mix(in_srgb,var(--primary)_5%,var(--card))] group-hover:bg-[color-mix(in_srgb,var(--primary)_10%,var(--card))]"
    case "dropTarget":
      return "bg-[color-mix(in_srgb,var(--primary)_5%,var(--card))]"
    case "folder":
      return "bg-[color-mix(in_srgb,var(--muted)_40%,var(--card))] group-hover:bg-[color-mix(in_srgb,var(--muted)_50%,var(--card))]"
    case "child":
      return "bg-[color-mix(in_srgb,var(--muted)_20%,var(--card))] group-hover:bg-[color-mix(in_srgb,var(--muted)_30%,var(--card))]"
    default:
      return "bg-background group-hover:bg-[color-mix(in_srgb,var(--muted)_30%,var(--card))]"
  }
}

// Línea de 2px que marca dónde caería una fila soltada entre dos filas de raíz. Se pinta
// como `inset shadow` sobre las celdas (no un `div` absoluto sobre el `<tr>`, que con
// `border-collapse` no es fiable) — ver el prototipo de referencia del feature.
function gapLineClass(dropTarget: { t: "gap"; index: number } | { t: "folder"; id: string } | null, topIndex: number): string {
  if (!dropTarget || dropTarget.t !== "gap") return ""
  return cn(
    dropTarget.index === topIndex && "shadow-[inset_0_2px_0_0_var(--primary)]",
    dropTarget.index === topIndex + 1 && "shadow-[inset_0_-2px_0_0_var(--primary)]",
  )
}

// ── Component ──────────────────────────────────────────────────────────────

function HuemulTableInner<T>(
  {
    data,
    columns,
    actions,
    actionsMode = "dropdown",
    getRowKey,
    getRowClassName,
    emptyState,
    pagination,
    isLoading = false,
    isFetching = false,
    error,
    onRetry,
    sort,
    onSortChange,
    maxHeight = "",
    className,
    resizable = false,
    columnsStorageKey,
    selectable = false,
    selectedKeys,
    onSelectionChange,
    isExpandable,
    renderExpanded,
    expandedKeys,
    onExpandedChange,
    folders,
  }: HuemulTableProps<T>,
  ref: React.ForwardedRef<HuemulTableHandle>,
) {
  const { t } = useTranslation("common")

  const hasActions = (!!actions && actions.length > 0) || !!folders
  const hasExpand = !!renderExpanded
  const expanded = expandedKeys ?? new Set<string>()

  const toggleExpanded = React.useCallback(
    (key: string) => {
      if (!onExpandedChange) return
      const next = new Set(expanded)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      onExpandedChange(next)
    },
    [onExpandedChange, expanded],
  )

  // ── Selección de filas ─────────────────────────────────────────────────────
  const selected = selectedKeys ?? new Set<string>()
  const visibleKeys = React.useMemo(() => data.map(getRowKey), [data, getRowKey])
  const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((k) => selected.has(k))
  const someVisibleSelected = visibleKeys.some((k) => selected.has(k))
  const headerCheckState: boolean | "indeterminate" = allVisibleSelected
    ? true
    : someVisibleSelected
    ? "indeterminate"
    : false

  const toggleAllVisible = React.useCallback(() => {
    if (!onSelectionChange) return
    const next = new Set(selected)
    if (allVisibleSelected) {
      visibleKeys.forEach((k) => next.delete(k))
    } else {
      visibleKeys.forEach((k) => next.add(k))
    }
    onSelectionChange(next)
  }, [onSelectionChange, selected, allVisibleSelected, visibleKeys])

  const toggleRow = React.useCallback(
    (key: string) => {
      if (!onSelectionChange) return
      const next = new Set(selected)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      onSelectionChange(next)
    },
    [onSelectionChange, selected],
  )

  const toggleFolderChildren = React.useCallback(
    (childKeys: string[]) => {
      if (!onSelectionChange) return
      const allSelected = childKeys.length > 0 && childKeys.every((k) => selected.has(k))
      const next = new Set(selected)
      if (allSelected) childKeys.forEach((k) => next.delete(k))
      else childKeys.forEach((k) => next.add(k))
      onSelectionChange(next)
    },
    [onSelectionChange, selected],
  )

  // Anchos por columna (px) — solo relevantes en modo `resizable`.
  const { getWidth, setWidth } = useColumnWidths(columns, resizable ? columnsStorageKey : undefined)

  const totalWidth = React.useMemo(() => {
    if (!resizable) return undefined
    const cols = columns.reduce((sum, col) => sum + getWidth(col.key), 0)
    return (
      cols +
      (hasActions ? ACTIONS_COL_WIDTH : 0) +
      (selectable ? SELECT_COL_WIDTH : 0) +
      (hasExpand ? EXPAND_COL_WIDTH : 0)
    )
  }, [resizable, columns, getWidth, hasActions, selectable, hasExpand])

  const colSpan =
    columns.length +
    (hasExpand ? 1 : 0) +
    (selectable ? 1 : 0) +
    (resizable ? 1 : 0) +
    (hasActions ? 1 : 0)

  // Arrastre del borde derecho de una cabecera. Usa pointer capture para seguir
  // el cursor aunque salga del handle.
  const startResize = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>, colKey: string, minW: number) => {
      e.preventDefault()
      e.stopPropagation()
      const startX = e.clientX
      const startWidth = getWidth(colKey)
      const handleEl = e.currentTarget
      handleEl.setPointerCapture(e.pointerId)
      const onMove = (ev: PointerEvent) => {
        setWidth(colKey, Math.max(minW, Math.round(startWidth + (ev.clientX - startX))))
      }
      const onUp = () => {
        try { handleEl.releasePointerCapture(e.pointerId) } catch { /* noop */ }
        handleEl.removeEventListener("pointermove", onMove)
        handleEl.removeEventListener("pointerup", onUp)
      }
      handleEl.addEventListener("pointermove", onMove)
      handleEl.addEventListener("pointerup", onUp)
    },
    [getWidth, setWidth],
  )

  function handleSortClick(sortKey: string) {
    if (!onSortChange) return
    if (sort === `${sortKey}_asc`) {
      onSortChange(`${sortKey}_desc`)
    } else if (sort === `${sortKey}_desc`) {
      onSortChange(null)
    } else {
      onSortChange(`${sortKey}_asc`)
    }
  }

  function SortIcon({ sortKey }: { sortKey: string }) {
    if (sort === `${sortKey}_asc`) return <ArrowUp className="h-3 w-3" />
    if (sort === `${sortKey}_desc`) return <ArrowDown className="h-3 w-3" />
    return <ChevronsUpDown className="h-3 w-3 opacity-40" />
  }

  // ── Carpetas: modelo de filas ────────────────────────────────────────────
  const primaryColKey = React.useMemo(() => (columns.find((c) => c.primary) ?? columns[0])?.key, [columns])

  const { renderRows, rootLength } = React.useMemo(() => {
    if (!folders) {
      const rows: RenderRow<T>[] = data.map((item, i) => ({
        kind: "item" as const,
        item,
        key: getRowKey(item),
        folderId: null,
        topIndex: i,
      }))
      return { renderRows: rows, rootLength: rows.length }
    }

    const byFolder = new Map<string | null, T[]>()
    for (const item of data) {
      const fid = folders.getFolderId(item)
      const list = byFolder.get(fid)
      if (list) list.push(item)
      else byFolder.set(fid, [item])
    }
    const rootItems = byFolder.get(null) ?? []

    type RootEntry = { kind: "folder"; folder: HuemulTableFolder } | { kind: "root-item"; item: T }
    const folderEntries: RootEntry[] = folders.folders.map((folder) => ({ kind: "folder", folder }))
    const itemEntries: RootEntry[] = rootItems.map((item) => ({ kind: "root-item", item }))
    // `foldersFirst: false` no tiene forma de intercalar carpetas e ítems de raíz sin un
    // orden explícito compartido entre `folders.folders` y `data` — limitación conocida,
    // documentada: las carpetas quedan después de los ítems de raíz, en su propio orden.
    // No la ejercita ningún consumidor actual (assets-types usa el default `true`).
    const rootSeq: RootEntry[] = folders.foldersFirst === false
      ? [...itemEntries, ...folderEntries]
      : [...folderEntries, ...itemEntries]

    const rows: RenderRow<T>[] = []
    rootSeq.forEach((entry, topIndex) => {
      if (entry.kind === "folder") {
        const children = byFolder.get(entry.folder.id) ?? []
        const open = folders.openFolders.has(entry.folder.id)
        const count = entry.folder.itemCount ?? children.length
        rows.push({ kind: "folder", folder: entry.folder, topIndex, open, count, childKeys: children.map(getRowKey) })
        if (open) {
          if (children.length === 0) {
            rows.push({ kind: "empty-folder", folder: entry.folder })
          } else {
            for (const child of children) {
              rows.push({ kind: "item", item: child, key: getRowKey(child), folderId: entry.folder.id, topIndex })
            }
          }
        }
      } else {
        rows.push({ kind: "item", item: entry.item, key: getRowKey(entry.item), folderId: null, topIndex })
      }
    })

    return { renderRows: rows, rootLength: rootSeq.length }
  }, [folders, data, getRowKey])

  const itemByKey = React.useMemo(() => {
    const map = new Map<string, T>()
    for (const row of renderRows) if (row.kind === "item") map.set(row.key, row.item)
    return map
  }, [renderRows])
  const getItemByKey = React.useCallback((key: string) => itemByKey.get(key), [itemByKey])

  const drag = useTableFolderDrag(folders, getItemByKey)

  // ── Carpetas: crear (inline, ancla fija) ──────────────────────────────────
  const [creating, setCreating] = React.useState<{ anchorTopIndex: number } | null>(null)
  const [draftName, setDraftName] = React.useState("")
  const [draftError, setDraftError] = React.useState<string | null>(null)
  const [isSavingDraft, setIsSavingDraft] = React.useState(false)
  const isSubmittingDraftRef = React.useRef(false)

  const openCreate = React.useCallback(
    (clickedTopIndex: number | null) => {
      if (!folders) return
      const anchor = folders.foldersFirst !== false ? folders.folders.length : clickedTopIndex ?? rootLength
      setCreating({ anchorTopIndex: anchor })
      setDraftName("")
      setDraftError(null)
    },
    [folders, rootLength],
  )

  const cancelDraft = React.useCallback(() => {
    setCreating(null)
    setDraftError(null)
  }, [])

  const submitDraft = React.useCallback(async () => {
    if (!folders || isSubmittingDraftRef.current) return
    const name = draftName.trim()
    if (!name) { cancelDraft(); return }
    isSubmittingDraftRef.current = true
    setIsSavingDraft(true)
    setDraftError(null)
    try {
      const created = await folders.onCreateFolder(name, creating?.anchorTopIndex)
      if (created) {
        folders.onOpenFoldersChange(new Set(folders.openFolders).add(created.id))
      }
      setCreating(null)
    } catch (err) {
      setDraftError(getErrorMessage(err, t("folderCreateError")))
    } finally {
      isSubmittingDraftRef.current = false
      setIsSavingDraft(false)
    }
  }, [folders, draftName, creating, cancelDraft, t])

  React.useImperativeHandle(ref, () => ({ startCreateFolder: () => openCreate(null) }), [openCreate])

  const displayRows = React.useMemo<DisplayRow<T>[]>(() => {
    if (!creating) return renderRows
    const boundary = creating.anchorTopIndex
    const out: DisplayRow<T>[] = []
    let inserted = false
    for (const row of renderRows) {
      if (!inserted && row.kind !== "empty-folder" && row.topIndex >= boundary) {
        out.push({ kind: "create-form" })
        inserted = true
      }
      out.push(row)
    }
    if (!inserted) out.push({ kind: "create-form" })
    return out
  }, [renderRows, creating])

  // ── Carpetas: renombrar (inline) ──────────────────────────────────────────
  const [editingFolderId, setEditingFolderId] = React.useState<string | null>(null)
  const [editName, setEditName] = React.useState("")
  const [editError, setEditError] = React.useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = React.useState(false)
  const isSubmittingEditRef = React.useRef(false)

  const startEditFolder = React.useCallback((folder: HuemulTableFolder) => {
    setEditingFolderId(folder.id)
    setEditName(folder.name)
    setEditError(null)
  }, [])

  const cancelEditFolder = React.useCallback(() => {
    setEditingFolderId(null)
    setEditError(null)
  }, [])

  const submitEditFolder = React.useCallback(
    async (folder: HuemulTableFolder) => {
      if (!folders?.onRenameFolder || isSubmittingEditRef.current) return
      const name = editName.trim()
      if (!name || name === folder.name) { cancelEditFolder(); return }
      isSubmittingEditRef.current = true
      setIsSavingEdit(true)
      setEditError(null)
      try {
        await folders.onRenameFolder(folder, name)
        setEditingFolderId(null)
      } catch (err) {
        setEditError(getErrorMessage(err, t("folderRenameError")))
      } finally {
        isSubmittingEditRef.current = false
        setIsSavingEdit(false)
      }
    },
    [folders, editName, cancelEditFolder, t],
  )

  const toggleFolderOpen = React.useCallback(
    (folderId: string) => {
      if (!folders) return
      const next = new Set(folders.openFolders)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      folders.onOpenFoldersChange(next)
    },
    [folders],
  )

  // ── Carpetas: acción "Mover a carpeta" inyectada al final de las acciones ──
  const effectiveActions = React.useMemo<HuemulTableAction<T>[] | undefined>(() => {
    if (!folders) return actions
    const buildMoveTargets = (item: T): HuemulTableActionItem<T>[] => {
      const currentFolderId = folders.getFolderId(item)
      const targets: HuemulTableActionItem<T>[] = folders.folders
        .filter((f) => f.id !== currentFolderId)
        .map((f) => ({ key: f.id, label: f.name, onClick: (it: T) => folders.onMoveRow(it, f.id) }))
      if (currentFolderId !== null) {
        targets.push({ key: "__root__", label: t("removeFromFolder"), onClick: (it: T) => folders.onMoveRow(it, null) })
      }
      return targets
    }
    const moveToFolderAction: HuemulTableAction<T> = {
      key: "__moveToFolder",
      label: t("moveToFolder"),
      icon: Folder,
      show: (item) => buildMoveTargets(item).length > 0,
      items: buildMoveTargets,
      // `items()` con 0 o 1 entrada se trata como acción plana más abajo (ver el resto
      // del componente): `onClick` replica ese único destino.
      onClick: (item) => {
        const targets = buildMoveTargets(item)
        if (targets.length > 0) targets[0].onClick(item)
      },
      separator: true,
    }
    return [...(actions ?? []), moveToFolderAction]
  }, [actions, folders, t])

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    const detail = (error as unknown as Record<string, unknown>).detail as string | undefined
    return (
      <div className={cn("rounded-lg border border-destructive/30 bg-card flex-1 min-h-0", className)}>
        <div className="flex flex-col items-center justify-center py-14 text-center px-6 gap-3">
          <AlertCircle className="w-9 h-9 text-destructive" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{error.message}</p>
            {detail && (
              <p className="text-xs text-muted-foreground max-w-sm">{detail}</p>
            )}
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:cursor-pointer transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t("retry")}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  // Con `folders`, `data` puede estar vacío aunque haya carpetas para mostrar (p. ej.
  // todas colapsadas, sin ítems de raíz en esta página) — el criterio real de "no hay
  // nada que mostrar" es `renderRows`, no `data.length`.
  const isEffectivelyEmpty = folders ? renderRows.length === 0 : data.length === 0
  if (!isLoading && isEffectivelyEmpty && emptyState) {
    const EmptyIcon = emptyState.icon ?? Inbox
    return (
      <div className={cn("rounded-lg border border-border bg-card flex-1 min-h-0", className)}>
        <div className="flex flex-col items-center justify-center py-14 text-center px-6">
          <EmptyIcon className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">{emptyState.title}</p>
          {emptyState.description && (
            <p className="text-xs text-muted-foreground mt-1">{emptyState.description}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden flex flex-col flex-1 min-h-0", className)}>
      {/* Refetch indicator */}
      <div
        className={cn(
          "h-0.5 w-full transition-opacity duration-300",
          isFetching ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="h-full w-full bg-primary animate-pulse" />
      </div>

      {/* Scrollable table area */}
      <div className={cn("overflow-auto flex-1", maxHeight)}>
        <table
          className="w-full caption-bottom text-sm"
          style={resizable ? { tableLayout: "fixed", minWidth: totalWidth } : undefined}
        >
          {resizable && (
            <colgroup>
              {hasExpand && <col style={{ width: EXPAND_COL_WIDTH }} />}
              {selectable && <col style={{ width: SELECT_COL_WIDTH }} />}
              {columns.map((col) => (
                <col
                  key={col.key}
                  style={{ width: getWidth(col.key) }}
                  className={cn(col.hideOnMobile && "hidden sm:table-column")}
                />
              ))}
              {/* Absorbe el espacio sobrante cuando las columnas no llenan el contenedor. */}
              <col />
              {hasActions && <col style={{ width: ACTIONS_COL_WIDTH }} />}
            </colgroup>
          )}
          {/* ── Header ── */}
          <TableHeader className="sticky top-0 z-20 bg-muted">
            <TableRow className="border-b border-border hover:bg-transparent">
              {hasExpand && <TableHead aria-hidden className="h-auto px-1 py-3 w-[1%]" />}
              {selectable && (
                <TableHead className="h-auto px-4 py-3 w-[1%] whitespace-nowrap">
                  <Checkbox
                    checked={headerCheckState}
                    onCheckedChange={toggleAllVisible}
                    aria-label={t("selectAll")}
                    disabled={visibleKeys.length === 0}
                  />
                </TableHead>
              )}
              {columns.map((col) => {
                const canResize = resizable && col.resizable !== false
                // Divisor sutil entre cabeceras de columnas de datos.
                const showDivider = resizable
                return (
                <TableHead
                  key={col.key}
                  className={cn(
                    "h-auto px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap",
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                    !resizable && col.width,
                    canResize && "relative",
                    showDivider && "border-r border-border",
                    col.hideOnMobile && "hidden sm:table-cell",
                    col.sticky && "sticky left-0 z-20 bg-muted border-r border-border"
                  )}
                >
                  {col.renderHeader ? (
                    col.renderHeader()
                  ) : col.sortKey ? (
                    <button
                      type="button"
                      onClick={() => handleSortClick(col.sortKey!)}
                      className={cn(
                        "inline-flex items-center gap-1 hover:cursor-pointer hover:text-foreground transition-colors max-w-full",
                        resizable && "overflow-hidden",
                        (sort === `${col.sortKey}_asc` || sort === `${col.sortKey}_desc`) && "text-foreground"
                      )}
                    >
                      <span className={cn(resizable && "truncate")}>{col.label}</span>
                      <SortIcon sortKey={col.sortKey} />
                    </button>
                  ) : (
                    <span className={cn(resizable && "block truncate")}>{col.label}</span>
                  )}
                  {canResize && (
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      onPointerDown={(e) => startResize(e, col.key, col.minWidth ?? MIN_COL_WIDTH)}
                      onClick={(e) => e.stopPropagation()}
                      className="group/rz absolute right-0 top-0 z-10 flex h-full w-2 justify-end cursor-col-resize touch-none select-none"
                    >
                      {/* El border-r del th es el divisor en reposo; este se ilumina sobre él al acercar el cursor. */}
                      <div className="h-full w-0.5 bg-transparent transition-colors group-hover/rz:bg-primary group-active/rz:bg-primary" />
                    </div>
                  )}
                </TableHead>
                )
              })}
              {resizable && <TableHead aria-hidden className="p-0" />}
              {hasActions && (
                <TableHead className="h-auto px-4 py-3 text-right text-xs font-semibold text-muted-foreground w-[1%] whitespace-nowrap sticky right-0 z-30 bg-muted border-l border-border">
                  <span className={cn(resizable && "block truncate")}>{t("actions")}</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          {/* ── Body ── */}
          <TableBody
            className={cn(
              "transition-opacity duration-200",
              isFetching && !isLoading ? "opacity-50 pointer-events-none" : "opacity-100"
            )}
            {...(folders ? drag.bodyDropProps(rootLength) : {})}
          >
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="bg-background hover:bg-background">
                    {hasExpand && <TableCell className="px-1 py-3" />}
                    {selectable && (
                      <TableCell className="px-4 py-3">
                        <Skeleton className="h-4 w-4 rounded-lg" />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn("px-4 py-3", col.hideOnMobile && "hidden sm:table-cell")}
                      >
                        <Skeleton className="h-4 w-full max-w-45" />
                      </TableCell>
                    ))}
                    {resizable && <TableCell aria-hidden className="p-0" />}
                    {hasActions && (
                      <TableCell className="px-4 py-3 text-right sticky right-0 z-10 bg-background border-l border-border">
                        <Skeleton className="h-7 w-7 ml-auto" />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              : displayRows.map((row) => {
                  // ── Fila de carpeta ──────────────────────────────────────
                  if (row.kind === "folder") {
                    const folder = row.folder
                    const isEditingThis = editingFolderId === folder.id
                    const isDropHighlighted = drag.dropTarget?.t === "folder" && drag.dropTarget.id === folder.id
                    const bg = isDropHighlighted ? stickyBg("dropTarget") : stickyBg("folder")
                    const childCheckState: boolean | "indeterminate" = row.childKeys.length === 0
                      ? false
                      : row.childKeys.every((k) => selected.has(k))
                      ? true
                      : row.childKeys.some((k) => selected.has(k))
                      ? "indeterminate"
                      : false

                    return (
                      <TableRow
                        key={`folder:${folder.id}`}
                        className={cn(
                          "group cursor-pointer",
                          isDropHighlighted
                            ? "ring-1 ring-inset ring-primary bg-primary/5 hover:bg-primary/5"
                            : "bg-[color-mix(in_srgb,var(--muted)_15%,var(--card))] hover:bg-[color-mix(in_srgb,var(--muted)_25%,var(--card))]",
                          gapLineClass(drag.dropTarget, row.topIndex),
                        )}
                        aria-expanded={row.open}
                        onClick={() => toggleFolderOpen(folder.id)}
                        {...drag.folderDropProps(folder.id)}
                      >
                        {hasExpand && <TableCell className="px-1 py-3" />}
                        {selectable && (
                          <TableCell className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={childCheckState}
                              onCheckedChange={() => toggleFolderChildren(row.childKeys)}
                              aria-label={t("select")}
                              disabled={row.childKeys.length === 0}
                            />
                          </TableCell>
                        )}
                        {columns.map((col) => {
                          const isPrimary = col.key === primaryColKey
                          return (
                          <TableCell
                            key={col.key}
                            className={cn(
                              "px-4 py-3 text-sm",
                              col.hideOnMobile && "hidden sm:table-cell",
                              col.sticky && cn("sticky left-0 z-10 border-r border-border", bg),
                              isPrimary && "group/row relative",
                            )}
                          >
                            {isPrimary && (
                              <>
                                <FolderNameCell
                                  name={folder.name}
                                  open={row.open}
                                  onToggle={() => toggleFolderOpen(folder.id)}
                                  isEditing={isEditingThis}
                                  editValue={editName}
                                  onEditChange={setEditName}
                                  onEditSubmit={() => submitEditFolder(folder)}
                                  onEditCancel={cancelEditFolder}
                                  isSavingEdit={isSavingEdit && isEditingThis}
                                  editError={isEditingThis ? editError : null}
                                  countLabel={folders!.renderCount ? folders!.renderCount(row.count) : t("itemsCount", { count: row.count })}
                                />
                                {folders!.canCreateFolder !== false && (
                                  <InsertFolderStrip isDragActive={drag.isDragging} onOpen={() => openCreate(row.topIndex)} label={t("newFolder")} />
                                )}
                              </>
                            )}
                          </TableCell>
                          )
                        })}
                        {resizable && <TableCell aria-hidden className="p-0" />}
                        {hasActions && (
                          <TableCell
                            className={cn("px-4 py-3 text-right sticky right-0 z-10 border-l border-border", bg)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {(folders!.onRenameFolder || folders!.onDeleteFolder) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <HuemulButton variant="ghost" size="sm" icon={MoreVertical} className="h-7 w-7 p-0 hover:bg-muted" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-40">
                                  {folders!.onRenameFolder && (
                                    <DropdownMenuItem onSelect={() => setTimeout(() => startEditFolder(folder), 0)} className="hover:cursor-pointer">
                                      <Pencil className="mr-2 h-4 w-4" />
                                      {t("renameFolder")}
                                    </DropdownMenuItem>
                                  )}
                                  {folders!.onDeleteFolder && (
                                    <DropdownMenuItem
                                      onSelect={() => setTimeout(() => folders!.onDeleteFolder!(folder), 0)}
                                      className="hover:cursor-pointer text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      {t("deleteFolder")}
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  }

                  // ── Fila "carpeta vacía" ─────────────────────────────────
                  if (row.kind === "empty-folder") {
                    const isDropHighlighted = drag.dropTarget?.t === "folder" && drag.dropTarget.id === row.folder.id
                    return (
                      <TableRow
                        key={`empty:${row.folder.id}`}
                        className={cn("hover:bg-transparent", isDropHighlighted ? "ring-1 ring-inset ring-primary bg-primary/5" : "bg-muted/20")}
                        {...drag.folderDropProps(row.folder.id)}
                      >
                        <TableCell colSpan={colSpan} className="py-2 pl-16 pr-4">
                          <EmptyFolderHint label={t("emptyFolderHint")} />
                        </TableCell>
                      </TableRow>
                    )
                  }

                  // ── Formulario de creación de carpeta (ancla fija) ───────
                  if (row.kind === "create-form") {
                    return (
                      <TableRow key="__create-folder" className="bg-primary/5 hover:bg-primary/5">
                        <TableCell colSpan={colSpan} className="p-2">
                          <FolderCreateForm
                            value={draftName}
                            onChange={setDraftName}
                            onSubmit={submitDraft}
                            onCancel={cancelDraft}
                            isSaving={isSavingDraft}
                            error={draftError}
                            placeholder={t("folderNamePlaceholder")}
                            createLabel={t("create")}
                            cancelLabel={t("cancel")}
                            hint={folders && folders.foldersFirst !== false ? t("createFolderHintOrdered") : t("createFolderHint")}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  }

                  // ── Fila de ítem (idéntica a la tabla plana cuando no hay `folders`) ──
                  const item = row.item
                  const key = row.key
                  const isChild = !!folders && row.folderId !== null
                  const visibleActions = effectiveActions?.filter((a) => !a.show || a.show(item)) ?? []
                  // `selectable` controla SOLO la columna de checkboxes. `selectedKeys` sin
                  // `selectable` = resaltado de fila sin multi-selección (patrón master-detail).
                  const isSelected = selected.has(key)
                  const isDropHighlighted = isChild && drag.dropTarget?.t === "folder" && drag.dropTarget.id === row.folderId
                  const customRowClass = getRowClassName?.(item)
                  const rowExtraClass = isDropHighlighted
                    ? "ring-1 ring-inset ring-primary bg-primary/5 hover:bg-primary/5"
                    : customRowClass ?? (isChild ? "bg-muted/20 hover:bg-muted/30" : isSelected ? "bg-primary/5 hover:bg-primary/10" : "")
                  // La celda de acciones es sticky: su fondo debe ser SIEMPRE opaco para tapar las
                  // columnas que pasan por debajo al scrollear en horizontal. Por eso NO reusa
                  // `getRowClassName` (puede venir vacío o con alpha, p. ej. `bg-primary/5`) —
                  // el resaltado de fila se expresa vía `selectedKeys`/`folders`, no vía className.
                  const stickyExtraClass = isDropHighlighted
                    ? stickyBg("dropTarget")
                    : isChild
                    ? stickyBg("child")
                    : isSelected
                    ? stickyBg("selected")
                    : stickyBg("default")
                  const canExpand = hasExpand && (isExpandable?.(item) ?? true)
                  const isExpanded = canExpand && expanded.has(key)
                  const dragProps = folders ? drag.rowDragProps(key) : {}
                  const dropProps = !folders ? {} : isChild ? drag.folderDropProps(row.folderId as string) : drag.gapDropProps(row.topIndex)
                  const isDragCursor = folders && folders.canDragRows !== false

                  return (
                    <React.Fragment key={key}>
                    <TableRow
                      className={cn(
                        "group",
                        rowExtraClass || "bg-background hover:bg-muted/30",
                        !isChild && folders && gapLineClass(drag.dropTarget, row.topIndex),
                        isDragCursor && "cursor-grab active:cursor-grabbing",
                        drag.dragKey === key && "opacity-35",
                      )}
                      data-selected={isSelected || undefined}
                      {...dragProps}
                      {...dropProps}
                    >
                      {hasExpand && (
                        <TableCell className="px-1 py-3" onClick={(e) => e.stopPropagation()}>
                          {canExpand && (
                            <button
                              type="button"
                              onClick={() => toggleExpanded(key)}
                              aria-expanded={isExpanded}
                              aria-label={isExpanded ? t("collapseRow") : t("expandRow")}
                              className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted hover:cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
                            </button>
                          )}
                        </TableCell>
                      )}
                      {selectable && (
                        <TableCell className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selected.has(key)}
                            onCheckedChange={() => toggleRow(key)}
                            aria-label={t("select")}
                          />
                        </TableCell>
                      )}
                      {columns.map((col) => {
                        const isPrimary = folders && col.key === primaryColKey
                        return (
                        <TableCell
                          key={col.key}
                          className={cn(
                            "px-4 py-3 text-sm",
                            col.align === "right"
                              ? "text-right"
                              : col.align === "center"
                              ? "text-center"
                              : "text-left",
                            resizable && "overflow-hidden text-ellipsis",
                            col.hideOnMobile && "hidden sm:table-cell",
                            col.sticky && cn("sticky left-0 z-10 border-r border-border", stickyExtraClass),
                            isPrimary && "group/row relative",
                          )}
                        >
                          {isPrimary ? (
                            <div className={cn("flex min-w-0 items-center gap-1.5", isChild && "pl-6")}>
                              {isChild && <span aria-hidden className="-my-3 h-auto w-px self-stretch bg-border" />}
                              <div className="min-w-0 flex-1">{col.render(item)}</div>
                              {!isChild && folders!.canCreateFolder !== false && (
                                <InsertFolderStrip isDragActive={drag.isDragging} onOpen={() => openCreate(row.topIndex)} label={t("newFolder")} />
                              )}
                            </div>
                          ) : (
                            col.render(item)
                          )}
                        </TableCell>
                        )
                      })}

                      {resizable && <TableCell aria-hidden className="p-0" />}
                      {hasActions && (
                        <TableCell className={cn("px-4 py-3 text-right whitespace-nowrap sticky right-0 z-10 border-l border-border", stickyExtraClass)}>
                          {actionsMode === "inline" ? (
                            // ── Inline icon buttons ──
                            <div className="flex items-center justify-end gap-1">
                              {visibleActions.map((action) => {
                                const ActionIcon = action.icon
                                const loading = action.isLoading?.(item) ?? false
                                const disabled = loading || (action.disabled?.(item) ?? false)
                                const subItems = action.items?.(item) ?? []
                                const hasMenu = subItems.length > 1
                                const button = (
                                  <HuemulButton
                                    key={hasMenu ? undefined : action.key}
                                    variant="ghost"
                                    size="sm"
                                    icon={loading ? Loader2 : ActionIcon}
                                    tooltip={action.label}
                                    tooltipSide="top"
                                    onClick={() => { if (!disabled && !hasMenu) action.onClick(item) }}
                                    disabled={disabled}
                                    className={cn(
                                      "h-7 w-7 p-0",
                                      loading && "[&_svg]:animate-spin text-muted-foreground",
                                      action.destructive && !disabled && "text-destructive hover:text-destructive hover:bg-destructive/10",
                                      action.className
                                    )}
                                  />
                                )

                                if (!hasMenu) return button

                                return (
                                  <DropdownMenu key={action.key}>
                                    <DropdownMenuTrigger asChild disabled={disabled}>
                                      {button}
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {subItems.map((sub) => {
                                        const SubIcon = sub.icon
                                        return (
                                          <DropdownMenuItem
                                            key={sub.key}
                                            onSelect={() => setTimeout(() => sub.onClick(item), 0)}
                                            className="hover:cursor-pointer"
                                          >
                                            {SubIcon && <SubIcon className="mr-2 h-4 w-4" />}
                                            {sub.label}
                                          </DropdownMenuItem>
                                        )
                                      })}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )
                              })}
                            </div>
                          ) : (
                            // ── Dropdown menu ──
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <HuemulButton
                                  variant="ghost"
                                  size="sm"
                                  icon={MoreVertical}
                                  aria-label="Actions"
                                  className="h-7 w-7 p-0 hover:bg-muted"
                                />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="min-w-40">
                                {visibleActions.map((action, idx, arr) => {
                                  const ActionIcon = action.icon
                                  const subItems = action.items?.(item) ?? []
                                  const hasMenu = subItems.length > 1

                                  if (hasMenu) {
                                    return (
                                      <React.Fragment key={action.key}>
                                        <DropdownMenuSub>
                                          <DropdownMenuSubTrigger
                                            className={cn(
                                              action.destructive && "text-destructive focus:text-destructive",
                                              action.className
                                            )}
                                          >
                                            <ActionIcon className="mr-2 h-4 w-4" />
                                            {action.label}
                                          </DropdownMenuSubTrigger>
                                          <DropdownMenuSubContent>
                                            {subItems.map((sub) => {
                                              const SubIcon = sub.icon
                                              return (
                                                <DropdownMenuItem
                                                  key={sub.key}
                                                  onSelect={() => setTimeout(() => sub.onClick(item), 0)}
                                                  className="hover:cursor-pointer"
                                                >
                                                  {SubIcon && <SubIcon className="mr-2 h-4 w-4" />}
                                                  {sub.label}
                                                </DropdownMenuItem>
                                              )
                                            })}
                                          </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                        {action.separator && idx < arr.length - 1 && <DropdownMenuSeparator />}
                                      </React.Fragment>
                                    )
                                  }

                                  return (
                                    <React.Fragment key={action.key}>
                                      <DropdownMenuItem
                                        onSelect={() => setTimeout(() => action.onClick(item), 0)}
                                        className={cn(
                                          "hover:cursor-pointer",
                                          action.destructive && "text-destructive focus:text-destructive",
                                          action.className
                                        )}
                                      >
                                        <ActionIcon className="mr-2 h-4 w-4" />
                                        {action.label}
                                      </DropdownMenuItem>
                                      {action.separator && idx < arr.length - 1 && <DropdownMenuSeparator />}
                                    </React.Fragment>
                                  )
                                })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="hover:bg-transparent bg-muted/20">
                        <TableCell colSpan={colSpan} className="p-0">
                          {renderExpanded!(item)}
                        </TableCell>
                      </TableRow>
                    )}
                    </React.Fragment>
                  )
                })}
            {!isLoading && folders && folders.canCreateFolder !== false && !creating && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={colSpan} className="p-0">
                  <AddFolderRow label={t("newFolder")} onOpen={() => openCreate(null)} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </table>
      </div>

      {/* ── Footer ── */}
      {pagination && (
        <HuemulPagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          hasNext={pagination.hasNext}
          hasPrevious={pagination.hasPrevious}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
          pageSizeOptions={pagination.pageSizeOptions}
          className="rounded-none border-0 border-t shadow-none"
        />
      )}
    </div>
  )
}

HuemulTableInner.displayName = "HuemulTable"

// `forwardRef` no preserva genéricos: se castea la salida para que cada consumidor
// siga viendo `HuemulTable<T>` como antes (con o sin `ref`, ambos opcionales).
export const HuemulTable = React.forwardRef(HuemulTableInner) as <T>(
  props: HuemulTableProps<T> & React.RefAttributes<HuemulTableHandle>
) => React.ReactElement
