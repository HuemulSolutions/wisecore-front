import * as React from "react"
import { type LucideIcon, MoreVertical, Inbox, ArrowUp, ArrowDown, ChevronsUpDown, AlertCircle, RefreshCw } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { HuemulButton } from "./huemul-button"
import { HuemulPagination } from "./huemul-pagination"
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
  /**
   * API sort key for this column (e.g. "document_name").
   * When provided the header becomes clickable.
   * Ascending = "key", descending = "-key".
   */
  sortKey?: string
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
  /** Error to display instead of table content */
  error?: Error | null
  /** Called when the user clicks the retry button on the error state */
  onRetry?: () => void
  /** Current sort value — "field" for asc, "-field" for desc, null for none */
  sort?: string | null
  /** Called when the user clicks a sortable column header */
  onSortChange?: (sort: string | null) => void
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
  error,
  onRetry,
  sort,
  onSortChange,
  maxHeight = "",
  className,
}: HuemulTableProps<T>) {
  const { t } = useTranslation("common")

  const hasActions = !!actions && actions.length > 0

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
    const detail = (error as Record<string, unknown>).detail as string | undefined
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
        <table className="w-full caption-bottom text-sm">
          {/* ── Header ── */}
          <TableHeader className="sticky top-0 z-20 bg-muted">
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
                  {col.sortKey ? (
                    <button
                      type="button"
                      onClick={() => handleSortClick(col.sortKey!)}
                      className={cn(
                        "inline-flex items-center gap-1 hover:cursor-pointer hover:text-foreground transition-colors",
                        (sort === `${col.sortKey}_asc` || sort === `${col.sortKey}_desc`) && "text-foreground"
                      )}
                    >
                      {col.label}
                      <SortIcon sortKey={col.sortKey} />
                    </button>
                  ) : col.label}
                </TableHead>
              ))}
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

                  return (
                    <TableRow key={key} className="group bg-background hover:bg-muted/30">
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
                        <TableCell className="px-4 py-3 text-right whitespace-nowrap sticky right-0 z-10 bg-background group-hover:bg-muted/30 border-l border-border">
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
