import * as React from "react"
import { MoreVertical, Inbox, ArrowUp, ArrowDown, ChevronsUpDown, AlertCircle, RefreshCw, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import type {
  HuemulTableActionsMode,
  HuemulTableColumn,
  HuemulTableAction,
  HuemulTableEmptyState,
  HuemulTablePagination,
  HuemulTableProps,
} from "@/types/huemul"

export type {
  HuemulTableActionsMode,
  HuemulTableColumn,
  HuemulTableAction,
  HuemulTableEmptyState,
  HuemulTablePagination,
  HuemulTableProps,
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
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { HuemulButton } from "./huemul-button"
import { HuemulPagination } from "./huemul-pagination"
import { useColumnWidths } from "@/hooks/useColumnWidths"
import { useTranslation } from "react-i18next"

// ── Constantes de redimensionado ─────────────────────────────────────────────
const MIN_COL_WIDTH = 80
const ACTIONS_COL_WIDTH = 64

// ── Component ──────────────────────────────────────────────────────────────

export function HuemulTable<T>({
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
}: HuemulTableProps<T>) {
  const { t } = useTranslation("common")

  const hasActions = !!actions && actions.length > 0

  // Anchos por columna (px) — solo relevantes en modo `resizable`.
  const { getWidth, setWidth } = useColumnWidths(columns, resizable ? columnsStorageKey : undefined)

  const totalWidth = React.useMemo(() => {
    if (!resizable) return undefined
    const cols = columns.reduce((sum, col) => sum + getWidth(col.key), 0)
    return cols + (hasActions ? ACTIONS_COL_WIDTH : 0)
  }, [resizable, columns, getWidth, hasActions])

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
  if (!isLoading && data.length === 0 && emptyState) {
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
          "h-[2px] w-full transition-opacity duration-300",
          isFetching ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="h-full w-full bg-primary animate-pulse" />
      </div>

      {/* Scrollable table area */}
      <div className={cn("overflow-auto flex-1", maxHeight)}>
        <table
          className={cn("caption-bottom text-sm", resizable ? "w-max" : "w-full")}
          style={resizable ? { tableLayout: "fixed", width: totalWidth } : undefined}
        >
          {resizable && (
            <colgroup>
              {columns.map((col) => (
                <col
                  key={col.key}
                  style={{ width: getWidth(col.key) }}
                  className={cn(col.hideOnMobile && "hidden sm:table-column")}
                />
              ))}
              {hasActions && <col style={{ width: ACTIONS_COL_WIDTH }} />}
            </colgroup>
          )}
          {/* ── Header ── */}
          <TableHeader className="sticky top-0 z-20 bg-muted">
            <TableRow className="border-b border-border hover:bg-transparent">
              {columns.map((col, index) => {
                const canResize = resizable && col.resizable !== false
                // Divisor sutil entre cabeceras; se omite en la última columna de
                // datos cuando hay columna de acciones (esa ya aporta su border-l).
                const showDivider = resizable && !(index === columns.length - 1 && hasActions)
                return (
                <TableHead
                  key={col.key}
                  className={cn(
                    "h-auto px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap",
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                    !resizable && col.width,
                    canResize && "relative",
                    showDivider && "border-r border-border",
                    col.hideOnMobile && "hidden sm:table-cell"
                  )}
                >
                  {col.sortKey ? (
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
              {hasActions && (
                <TableHead className="h-auto px-4 py-3 text-right text-xs font-semibold text-muted-foreground w-[1%] whitespace-nowrap sticky right-0 z-30 bg-muted border-l border-border">
                  {t("actions")}
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
          >
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="bg-background hover:bg-background">
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn("px-4 py-3", col.hideOnMobile && "hidden sm:table-cell")}
                      >
                        <Skeleton className="h-4 w-full max-w-[180px]" />
                      </TableCell>
                    ))}
                    {hasActions && (
                      <TableCell className="px-4 py-3 text-right sticky right-0 bg-background border-l border-border">
                        <Skeleton className="h-7 w-7 ml-auto" />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              : data.map((item) => {
                  const key = getRowKey(item)
                  const visibleActions = actions?.filter((a) => !a.show || a.show(item)) ?? []
                  const rowExtraClass = getRowClassName?.(item) ?? ''

                  return (
                    <TableRow key={key} className={cn("group", rowExtraClass || "bg-background hover:bg-muted/30")}>
                      {columns.map((col) => (
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
                            col.hideOnMobile && "hidden sm:table-cell"
                          )}
                        >
                          {col.render(item)}
                        </TableCell>
                      ))}

                      {hasActions && (
                        <TableCell className={cn("px-4 py-3 text-right whitespace-nowrap sticky right-0 z-10 border-l border-border", rowExtraClass || "bg-background group-hover:bg-muted/30")}>
                          {actionsMode === "inline" ? (
                            // ── Inline icon buttons ──
                            <div className="flex items-center justify-end gap-1">
                              {visibleActions.map((action) => {
                                const ActionIcon = action.icon
                                const loading = action.isLoading?.(item) ?? false
                                const disabled = loading || (action.disabled?.(item) ?? false)
                                return (
                                  <HuemulButton
                                    key={action.key}
                                    variant="ghost"
                                    size="sm"
                                    icon={loading ? Loader2 : ActionIcon}
                                    tooltip={action.label}
                                    tooltipSide="top"
                                    onClick={() => { if (!disabled) action.onClick(item) }}
                                    disabled={disabled}
                                    className={cn(
                                      "h-7 w-7 p-0",
                                      loading && "[&_svg]:animate-spin text-muted-foreground",
                                      action.destructive && !disabled && "text-destructive hover:text-destructive hover:bg-destructive/10",
                                      action.className
                                    )}
                                  />
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
                              <DropdownMenuContent align="end" className="min-w-[160px]">
                                {visibleActions.map((action, idx, arr) => {
                                  const ActionIcon = action.icon
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
                  )
                })}
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
