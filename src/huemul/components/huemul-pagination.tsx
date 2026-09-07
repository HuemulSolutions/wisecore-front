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
import { DEFAULT_PAGE_SIZE_OPTIONS } from "../constants"
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
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className,
  variant = "card",
  labelPosition = "end",
  showFirstLast = true,
}: HuemulPaginationProps) {
  const { t } = useTranslation("common")
  const isBare = variant === "bare"

  const totalPages =
    totalItems !== undefined ? Math.ceil(totalItems / pageSize) || 1 : undefined

  const pageRange = totalPages !== undefined ? buildPageRange(page, totalPages) : undefined

  // "1–10 de 128" style range label
  const rangeLabel =
    totalItems !== undefined
      ? `${((page - 1) * pageSize + 1).toLocaleString()}–${Math.min(page * pageSize, totalItems).toLocaleString()} ${t("pagination.of")} ${totalItems.toLocaleString()}`
      : undefined

  const isFirstPage = page === 1
  const isLastPage = totalPages !== undefined ? page >= totalPages : hasNext === false

  // ── Variant "detailed" ─────────────────────────────────────────────────
  // Estilo cerrado (grid de usuarios): botones de página por cada `pageSizeOptions`,
  // números colapsados vía `buildPageRange` cuando se conoce `totalItems`, y
  // degradación a solo Anterior/Siguiente cuando no (ver `UsersResponse`, que no trae
  // total — el caso real que motivó esta rama).
  if (variant === "detailed") {
    const navBtnClass = (disabled: boolean) =>
      cn(
        "flex h-7 w-7 items-center justify-center rounded-[7px] border transition-colors hover:cursor-pointer disabled:cursor-not-allowed",
        disabled
          ? "border-[#dfe4ec] bg-[#f7f9fb] text-[#c3ccd8]"
          : "border-[#dfe4ec] bg-white text-[#475569] hover:border-[#93b4f5]"
      )

    return (
      <div className={cn("flex flex-wrap items-center gap-2.5 border-t border-[#e5eaf0] bg-white px-4.5 py-2.5", className)}>
        {totalItems === 0 ? (
          <span className="text-[12.5px] text-[#64748b]">{t("pagination.noResults")}</span>
        ) : rangeLabel ? (
          <span className="whitespace-nowrap text-[12.5px] tabular-nums text-[#64748b]">
            {t("pagination.showing")} {rangeLabel}
          </span>
        ) : null}

        <div className="flex-1" />

        {onPageSizeChange && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="whitespace-nowrap text-xs text-[#94a3b8]">{t("pagination.perPage")}</span>
              {pageSizeOptions.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onPageSizeChange(size)}
                  className={cn(
                    "h-7 min-w-[30px] rounded-[7px] border px-[7px] text-[12.5px] font-medium transition-colors hover:cursor-pointer",
                    size === pageSize
                      ? "border-[#bfd3fb] bg-[#eef4ff] text-[#1d4ed8]"
                      : "border-[#dfe4ec] bg-white text-[#64748b] hover:border-[#93b4f5]"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
            <div className="h-4.5 w-px bg-[#e5eaf0]" />
          </>
        )}

        <div className="flex items-center gap-[5px]">
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => onPageChange(page - 1)}
            disabled={isFirstPage || hasPrevious === false}
            className={navBtnClass(isFirstPage || hasPrevious === false)}
          >
            <ChevronLeft className="h-[13px] w-[13px]" />
          </button>

          {pageRange?.map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className="flex h-7 min-w-[28px] items-center justify-center text-[12.5px] text-[#94a3b8] select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => p !== page && onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "h-7 min-w-[28px] rounded-[7px] border px-[7px] text-[12.5px] transition-colors",
                  p === page
                    ? "border-[#2563eb] bg-[#2563eb] font-semibold text-white pointer-events-none"
                    : "border-[#dfe4ec] bg-white font-medium text-[#475569] hover:cursor-pointer hover:border-[#93b4f5]"
                )}
              >
                {p}
              </button>
            )
          )}

          <button
            type="button"
            aria-label="Next page"
            onClick={() => onPageChange(page + 1)}
            disabled={isLastPage}
            className={navBtnClass(isLastPage)}
          >
            <ChevronRight className="h-[13px] w-[13px]" />
          </button>
        </div>
      </div>
    )
  }

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
        className={cn(
          "hover:cursor-pointer disabled:opacity-40 transition-colors",
          isBare
            ? "h-7 w-7 rounded-full border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent"
            : "h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        <Icon className="h-4 w-4" />
      </Button>
    )
  }

  // ── Sections ───────────────────────────────────────────────────────────

  const navSection = (
    <div className={cn("flex items-center gap-0.5", isBare ? "justify-end" : "justify-center")}>

      {/* First page — offset only */}
      {showFirstLast && totalPages !== undefined && (
        <NavBtn icon={ChevronsLeft} label="First page" onClick={() => onPageChange(1)} disabled={isFirstPage} />
      )}

      {/* Prev */}
      <NavBtn icon={ChevronLeft} label="Previous page" onClick={() => onPageChange(page - 1)} disabled={isFirstPage || hasPrevious === false} />

      {/* Page chips — visible past the chips breakpoint */}
      {pageRange !== undefined && (
        <div className={cn("hidden items-center gap-0.5 mx-1", isBare ? "@[220px]:flex" : "@[300px]:flex")}>
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

      {/* Compact X / Y indicator — visible below the chips breakpoint (or always for cursor-based) */}
      <div
        className={cn(
          "flex items-center gap-1 px-2.5 py-1 mx-0.5 rounded-md bg-muted/60",
          pageRange !== undefined ? (isBare ? "@[220px]:hidden" : "@[300px]:hidden") : ""
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
      {showFirstLast && totalPages !== undefined && (
        <NavBtn icon={ChevronsRight} label="Last page" onClick={() => onPageChange(totalPages)} disabled={isLastPage} />
      )}
    </div>
  )

  const metaSection = (
    <div className={cn("flex items-center gap-3", isBare ? "justify-start" : "justify-center @[440px]:justify-end")}>

      {rangeLabel && (
        <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
          {rangeLabel}
        </span>
      )}

      {onPageSizeChange && (
        <div className="flex items-center gap-1.5">
          <span className={cn("text-xs text-muted-foreground whitespace-nowrap hidden", isBare ? "@[220px]:block" : "@[300px]:block")}>
            {t("pagination.itemsPerPage")}
          </span>
          <Select
            value={pageSize.toString()}
            onValueChange={(v) => { onPageSizeChange(Number(v)) }}
          >
            <SelectTrigger className="h-7 w-18 text-xs hover:cursor-pointer">
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
  )

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className={cn("@container/pg", className)}>
      <div className={cn(
        "flex flex-col gap-2",
        isBare
          ? "@[280px]:flex-row @[280px]:items-center @[280px]:justify-between"
          : "@[440px]:flex-row @[440px]:items-center @[440px]:justify-between",
        isBare ? "min-w-0" : "px-3 py-2 bg-card border border-border rounded-lg shadow-xs"
      )}>
        {labelPosition === "start"
          ? <>{metaSection}{navSection}</>
          : <>{navSection}{metaSection}</>}
      </div>
    </div>
  )
}
