import * as React from "react"
import { type LucideIcon, MoreVertical, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Inbox } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { HuemulButton } from "./huemul-button"
import { useTranslation } from "react-i18next"

// ── Types ──────────────────────────────────────────────────────────────────

/** "dropdown" renders a ⋮ button that opens a menu. "inline" renders icon-only buttons. */
export type HuemulTableActionsMode = "dropdown" | "inline"

export interface HuemulTableColumn<T> {
  /** Unique key for the column */
  key: string
  /** Header label */
  label: string
  /** Optional Tailwind width class, e.g. "w-[20%]" */
  width?: string
  /** Hide on small screens */
  hideOnMobile?: boolean
  /** Text alignment (default: "left") */
  align?: "left" | "right" | "center"
  /** Cell renderer */
  render: (item: T) => ReactNode
}

export interface HuemulTableAction<T> {
  /** Unique key */
  key: string
  /** Label shown in dropdown or as tooltip in inline mode */
  label: string
  /** Lucide icon */
  icon: LucideIcon
  /** Click handler */
  onClick: (item: T) => void
  /** Show separator after this action (dropdown mode only) */
  separator?: boolean
  /** Destructive style (red tint) */
  destructive?: boolean
  /** Additional className for the menu item / button */
  className?: string
  /** Conditionally show this action */
  show?: (item: T) => boolean
}

export interface HuemulTableEmptyState {
  icon?: LucideIcon
  title: string
  description?: string
}

export interface HuemulTablePagination {
  /** Current page (1-indexed) */
  page: number
  /** Items per page */
  pageSize: number
  /** Total items across all pages (enables full pagination UI) */
  totalItems?: number
  /** Cursor-based: is there a next page? */
  hasNext?: boolean
  /** Cursor-based: is there a previous page? */
  hasPrevious?: boolean
  /** Page change handler */
  onPageChange: (page: number) => void
  /** Page size change handler (shows selector when provided) */
  onPageSizeChange?: (size: number) => void
  /** Available options for the page size selector */
  pageSizeOptions?: number[]
}

export interface HuemulTableProps<T> {
  /** Data rows */
  data: T[]
  /** Column definitions */
  columns: HuemulTableColumn<T>[]
  /** Row actions */
  actions?: HuemulTableAction<T>[]
  /**
   * How to render actions:
   * - "dropdown" (default) — a ⋮ button opens a dropdown menu
   * - "inline" — icon-only buttons rendered directly in the cell
   */
  actionsMode?: HuemulTableActionsMode
  /** Returns a unique string key per row */
  getRowKey: (item: T) => string
  /** Shown when data is empty and not loading */
  emptyState?: HuemulTableEmptyState
  /** Pagination config */
  pagination?: HuemulTablePagination
  /** Show skeleton rows while loading with no data */
  isLoading?: boolean
  /** Show subtle refetch indicator while data is present */
  isFetching?: boolean
  /** Max height of the table container (default: "max-h-[70vh]") */
  maxHeight?: string
  /** Additional className for the outer wrapper */
  className?: string
}

// ── Component ──────────────────────────────────────────────────────────────

export function HuemulTable<T>({
  data,
  columns,
  actions,
  actionsMode = "dropdown",
  getRowKey,
  emptyState,
  pagination,
  isLoading = false,
  isFetching = false,
  maxHeight = "max-h-[70vh]",
  className,
}: HuemulTableProps<T>) {
  const { t } = useTranslation("common")

  const hasActions = !!actions && actions.length > 0
  const totalPages =
    pagination && pagination.totalItems !== undefined
      ? Math.ceil(pagination.totalItems / pagination.pageSize) || 1
      : undefined

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!isLoading && data.length === 0 && emptyState) {
    const EmptyIcon = emptyState.icon ?? Inbox
    return (
      <div className={cn("rounded-lg border border-border bg-card", className)}>
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
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden flex flex-col", className)}>
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
        <table className="w-full caption-bottom text-sm">
          {/* ── Header ── */}
          <TableHeader className="sticky top-0 z-10 bg-muted/60">
            <TableRow className="border-b border-border hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "h-auto px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap",
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                    col.width,
                    col.hideOnMobile && "hidden sm:table-cell"
                  )}
                >
                  {col.label}
                </TableHead>
              ))}
              {hasActions && (
                <TableHead className="h-auto px-4 py-3 text-right text-xs font-semibold text-muted-foreground w-[1%] whitespace-nowrap">
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
                      <TableCell className="px-4 py-3 text-right">
                        <Skeleton className="h-7 w-7 ml-auto" />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              : data.map((item) => {
                  const key = getRowKey(item)
                  const visibleActions = actions?.filter((a) => !a.show || a.show(item)) ?? []

                  return (
                    <TableRow key={key} className="bg-background hover:bg-muted/30">
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
                            col.hideOnMobile && "hidden sm:table-cell"
                          )}
                        >
                          {col.render(item)}
                        </TableCell>
                      ))}

                      {hasActions && (
                        <TableCell className="px-4 py-3 text-right whitespace-nowrap">
                          {actionsMode === "inline" ? (
                            // ── Inline icon buttons ──
                            <div className="flex items-center justify-end gap-1">
                              {visibleActions.map((action) => {
                                const ActionIcon = action.icon
                                return (
                                  <HuemulButton
                                    key={action.key}
                                    variant="ghost"
                                    size="sm"
                                    icon={ActionIcon}
                                    tooltip={action.label}
                                    tooltipSide="top"
                                    onClick={() => action.onClick(item)}
                                    className={cn(
                                      "h-7 w-7 p-0",
                                      action.destructive && "text-destructive hover:text-destructive hover:bg-destructive/10",
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-2 bg-muted/20 border-t border-border">

          {/* Left: items per page */}
          <div className="flex items-center gap-2 min-w-0">
            {pagination.onPageSizeChange && pagination.pageSizeOptions ? (
              <>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {t("pagination.itemsPerPage")}
                </span>
                <Select
                  value={pagination.pageSize.toString()}
                  onValueChange={(v) => {
                    pagination.onPageSizeChange!(Number(v))
                  }}
                >
                  <SelectTrigger className="h-7 w-[72px] text-xs hover:cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pagination.pageSizeOptions.map((s) => (
                      <SelectItem key={s} value={s.toString()} className="text-xs">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : (
              <span />
            )}
          </div>

          {/* Center: page info */}
          <div className="flex items-center">
            <span className="text-xs text-muted-foreground">
              {totalPages !== undefined ? (
                <>
                  {t("pagination.page")} {pagination.page} {t("pagination.of")} {totalPages}
                  {" "}({pagination.totalItems} {t("pagination.items")})
                </>
              ) : (
                <>
                  {t("pagination.page")} {pagination.page}
                  {data.length > 0 && <> ({data.length} {t("pagination.items")})</>}
                </>
              )}
            </span>
          </div>

          {/* Right: navigation */}
          <div className="flex items-center gap-1">
            {totalPages !== undefined ? (
              // Full pagination (totalItems known)
              <>
                <HuemulButton
                  variant="outline"
                  size="sm"
                  icon={ChevronsLeft}
                  aria-label="First page"
                  onClick={() => pagination.onPageChange(1)}
                  disabled={pagination.page === 1}
                  className="h-7 w-7 p-0"
                />
                <HuemulButton
                  variant="outline"
                  size="sm"
                  icon={ChevronLeft}
                  aria-label="Previous page"
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="h-7 w-7 p-0"
                />
                <HuemulButton
                  variant="outline"
                  size="sm"
                  icon={ChevronRight}
                  aria-label="Next page"
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= (totalPages ?? 1)}
                  className="h-7 w-7 p-0"
                />
                <HuemulButton
                  variant="outline"
                  size="sm"
                  icon={ChevronsRight}
                  aria-label="Last page"
                  onClick={() => pagination.onPageChange(totalPages ?? 1)}
                  disabled={pagination.page >= (totalPages ?? 1)}
                  className="h-7 w-7 p-0"
                />
              </>
            ) : (
              // Cursor-based pagination
              <>
                <HuemulButton
                  variant="outline"
                  size="sm"
                  icon={ChevronLeft}
                  aria-label="Previous page"
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || pagination.hasPrevious === false}
                  className="h-7 w-7 p-0"
                />
                <HuemulButton
                  variant="outline"
                  size="sm"
                  icon={ChevronRight}
                  aria-label="Next page"
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  disabled={pagination.hasNext === false}
                  className="h-7 w-7 p-0"
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
