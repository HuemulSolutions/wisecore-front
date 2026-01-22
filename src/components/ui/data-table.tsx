import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreVertical, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import type { DataTableProps } from "@/types/data-table"

export type { TableColumn, TableAction, EmptyState, FooterStat, DataTableProps, PaginationConfig } from "@/types/data-table"

export function DataTable<T>({
  data,
  columns,
  actions,
  getRowKey,
  emptyState,
  footerStats,
  showCheckbox = false,
  selectedItems,
  onItemSelection,
  onSelectAll,
  rowClassName,
  maxHeight = "max-h-[75vh]",
  pagination,
  showFooterStats = true
}: DataTableProps<T>) {
  const EmptyIcon = emptyState?.icon
  const isAllSelected = showCheckbox && data.length > 0 && selectedItems?.size === data.length
  const isIndeterminate = showCheckbox && selectedItems && selectedItems.size > 0 && selectedItems.size < data.length

  // Empty state
  if (data.length === 0 && emptyState) {
    return (
      <Card className="border border-border bg-card">
        <div className="text-center py-12">
          {EmptyIcon && <EmptyIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />}
          <h3 className="text-lg font-medium text-foreground mb-2">{emptyState.title}</h3>
          <p className="text-muted-foreground">{emptyState.description}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`border border-border bg-card overflow-auto ${maxHeight}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-border">
              {showCheckbox && (
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={onSelectAll}
                    aria-label="Select all"
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = !!isIndeterminate
                      }
                    }}
                    className="hover:cursor-pointer"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-${column.align || "left"} text-xs font-medium text-muted-foreground ${
                    column.width || ""
                  } ${column.hideOnMobile ? "hidden sm:table-cell" : ""}`}
                >
                  {column.label}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground w-20">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-border">
            {data.map((item) => {
              const rowKey = getRowKey(item)
              const isSelected = selectedItems?.has(rowKey)

              return (
                <tr
                  key={rowKey}
                  className={`hover:bg-muted/30 transition-colors ${rowClassName || ""}`}
                >
                  {showCheckbox && onItemSelection && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onItemSelection(rowKey)}
                        aria-label={`Select ${rowKey}`}
                        className="hover:cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 text-sm ${column.hideOnMobile ? "hidden sm:table-cell" : ""}`}
                    >
                      {column.render(item)}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="hover:cursor-pointer h-8 w-8 p-0 hover:bg-muted">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action) => {
                            // Skip action if show function returns false
                            if (action.show && !action.show(item)) {
                              return null
                            }

                            const ActionIcon = action.icon

                            return (
                              <div key={action.key}>
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setTimeout(() => {
                                      action.onClick(item)
                                    }, 0)
                                  }}
                                  className={`hover:cursor-pointer ${
                                    action.destructive
                                      ? "text-destructive focus:text-destructive"
                                      : ""
                                  } ${action.className || ""}`}
                                >
                                  <ActionIcon className="mr-2 h-4 w-4" />
                                  {action.label}
                                </DropdownMenuItem>
                                {action.separator && <DropdownMenuSeparator />}
                              </div>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer stats */}
      {showFooterStats && footerStats && footerStats.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-2 sm:px-4 py-2 sm:py-3 bg-muted/20 text-xs text-muted-foreground border-t gap-1 sm:gap-0">
          {footerStats.map((stat, index) => (
            <span key={index} className="text-xs">
              {stat.label}: {stat.value}
            </span>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-2 sm:px-4 py-2 sm:py-3 bg-white border-t">
          {/* Items per page selector */}
          {pagination.onPageSizeChange && pagination.pageSizeOptions && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Items per page:</span>
              <Select
                value={pagination.pageSize.toString()}
                onValueChange={(value) => pagination.onPageSizeChange?.(Number(value))}
              >
                <SelectTrigger className="h-8 w-17.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pagination.pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Page info */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {pagination.totalItems !== undefined ? (
                <>
                  Page {pagination.page} of {Math.ceil(pagination.totalItems / pagination.pageSize) || 1}
                  {" "}({pagination.totalItems} items)
                </>
              ) : (
                <>
                  Page {pagination.page} ({data.length} items)
                </>
              )}
            </span>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            {pagination.totalItems !== undefined ? (
              // Full pagination with totalItems
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onPageChange(1)}
                  disabled={pagination.page === 1}
                  className="h-8 w-8 p-0 hover:cursor-pointer"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="h-8 w-8 p-0 hover:cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= Math.ceil(pagination.totalItems / pagination.pageSize)}
                  className="h-8 w-8 p-0 hover:cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (pagination.totalItems !== undefined) {
                      pagination.onPageChange(Math.ceil(pagination.totalItems / pagination.pageSize))
                    }
                  }}
                  disabled={
                    pagination.totalItems === undefined ||
                    pagination.page >= Math.ceil((pagination.totalItems ?? 1) / pagination.pageSize)
                  }
                  className="h-8 w-8 p-0 hover:cursor-pointer"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              // Cursor-based pagination with hasNext/hasPrevious
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || pagination.hasPrevious === false}
                  className="h-8 w-8 p-0 hover:cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  disabled={pagination.hasNext === false}
                  className="h-8 w-8 p-0 hover:cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
