import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns the list of page numbers (and "…" placeholders) to render.
 * Always includes the first and last page; shows ≤1 sibling around current.
 */
function buildPageRange(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const result: (number | "…")[] = [1]
  if (page > 3) result.push("…")
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
    result.push(i)
  }
  if (page + 1 < totalPages - 1) result.push("…")
  result.push(totalPages)
  return result
}

import type { HuemulPaginationProps } from "@/types/huemul"
export type { HuemulPaginationProps }

// ── Component ──────────────────────────────────────────────────────────────

export function HuemulPagination({
  page,
  pageSize,
  totalItems,
  hasNext,
  hasPrevious,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [100, 200, 500],
  className,
}: HuemulPaginationProps) {
  const { t } = useTranslation("common")

  const totalPages =
    totalItems !== undefined ? Math.ceil(totalItems / pageSize) || 1 : undefined

  const pageRange = totalPages !== undefined ? buildPageRange(page, totalPages) : undefined

  // "1–10 / 128" style range label
  const rangeLabel =
    totalItems !== undefined
      ? `${((page - 1) * pageSize + 1).toLocaleString()}–${Math.min(page * pageSize, totalItems).toLocaleString()} / ${totalItems.toLocaleString()}`
      : undefined

  const isFirstPage = page === 1
  const isLastPage = totalPages !== undefined ? page >= totalPages : hasNext === false

  // ── Nav icon button ────────────────────────────────────────────────────

  function NavBtn({
    icon: Icon,
    label,
    onClick,
    disabled,
  }: {
    icon: typeof ChevronLeft
    label: string
    onClick: () => void
    disabled: boolean
  }) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
        className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent hover:cursor-pointer disabled:opacity-40 transition-colors"
      >
        <Icon className="h-4 w-4" />
      </Button>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className={cn("@container/pg", className)}>
      <div className="flex flex-col @[440px]:flex-row @[440px]:items-center @[440px]:justify-between gap-2 px-3 py-2 bg-card border border-border rounded-lg shadow-xs">

        {/* ── Navigation ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-0.5">

          {/* First page — offset only */}
          {totalPages !== undefined && (
            <NavBtn icon={ChevronsLeft} label="First page" onClick={() => onPageChange(1)} disabled={isFirstPage} />
          )}

          {/* Prev */}
          <NavBtn icon={ChevronLeft} label="Previous page" onClick={() => onPageChange(page - 1)} disabled={isFirstPage || hasPrevious === false} />

          {/* Page chips — visible at ≥300px container width */}
          {pageRange !== undefined && (
            <div className="hidden @[300px]:flex items-center gap-0.5 mx-1">
              {pageRange.map((p, i) =>
                p === "…" ? (
                  <span
                    key={`e${i}`}
                    className="flex h-8 w-7 items-center justify-center text-xs text-muted-foreground select-none"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => p !== page && onPageChange(p)}
                    aria-label={`${t("pagination.page")} ${p}`}
                    aria-current={p === page ? "page" : undefined}
                    className={cn(
                      "h-8 w-8 rounded-md text-xs font-medium transition-colors",
                      p === page
                        ? "bg-primary text-primary-foreground shadow-sm pointer-events-none"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground hover:cursor-pointer"
                    )}
                  >
                    {p}
                  </button>
                )
              )}
            </div>
          )}

          {/* Compact X / Y indicator — visible below 300px (or always for cursor-based) */}
          <div
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 mx-0.5 rounded-md bg-muted/60",
              pageRange !== undefined ? "@[300px]:hidden" : ""
            )}
          >
            <span className="text-xs font-semibold tabular-nums leading-none">{page}</span>
            {totalPages !== undefined && (
              <>
                <span className="text-xs text-muted-foreground leading-none">/</span>
                <span className="text-xs text-muted-foreground tabular-nums leading-none">{totalPages}</span>
              </>
            )}
          </div>

          {/* Next */}
          <NavBtn icon={ChevronRight} label="Next page" onClick={() => onPageChange(page + 1)} disabled={isLastPage} />

          {/* Last page — offset only */}
          {totalPages !== undefined && (
            <NavBtn icon={ChevronsRight} label="Last page" onClick={() => onPageChange(totalPages)} disabled={isLastPage} />
          )}
        </div>

        {/* ── Right section: range count + items-per-page ─────────────── */}
        <div className="flex items-center justify-center @[440px]:justify-end gap-3">

          {rangeLabel && (
            <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
              {rangeLabel}
            </span>
          )}

          {onPageSizeChange && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden @[300px]:block">
                {t("pagination.itemsPerPage")}
              </span>
              <Select
                value={pageSize.toString()}
                onValueChange={(v) => { onPageSizeChange(Number(v)) }}
              >
                <SelectTrigger className="h-7 w-[72px] text-xs hover:cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((s) => (
                    <SelectItem key={s} value={s.toString()} className="text-xs">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
