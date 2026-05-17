import * as React from "react";
import { ChevronDown, RefreshCw, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HuemulButton } from "./huemul-button";

// ── Types ──────────────────────────────────────────────────────────────────

export interface HuemulFiltersProps {
  /** Filter fields to render inside the collapsible area. */
  children: React.ReactNode;

  /** Section title (default: key "huemulFilters.title" or "Filters"). */
  title?: string;

  /** Whether the section starts expanded (default: true). */
  defaultOpen?: boolean;

  /** Controlled open state. Use together with `onOpenChange` for external control. */
  open?: boolean;

  /** Called when the open state changes (controlled mode). */
  onOpenChange?: (open: boolean) => void;

  // ── Refresh ──────────────────────────────────────────────────────────────
  /** Called when the user clicks the refresh button. When omitted the button is hidden. */
  onRefresh?: () => void;

  /** When `true` the refresh icon spins and the button is disabled. */
  isRefreshing?: boolean;

  // ── Apply / Clear ────────────────────────────────────────────────────────
  /** Called when the user clicks the "Apply" button. When omitted the button is hidden. */
  onApply?: () => void;

  /** Called when the user clicks the "Clear" button. When omitted the button is hidden. */
  onClear?: () => void;

  /**
   * When `true` the Clear button is shown (only relevant when `onClear` is provided).
   * Typically set to `true` when at least one filter has a non-default value.
   */
  hasActiveFilters?: boolean;

  /** Extra className on the root wrapper. */
  className?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

/**
 * `HuemulFilters` — a collapsible, standardised filter panel for use across
 * different pages. It provides:
 *
 * - A header row with a collapse toggle and an optional refresh button.
 * - A styled content area where you place your filter fields (e.g. `HuemulField`).
 * - Optional "Apply" / "Clear" action buttons at the trailing end of the filter row.
 *
 * @example
 * ```tsx
 * <HuemulFilters
 *   onRefresh={refetch}
 *   isRefreshing={isFetching}
 *   onApply={handleApply}
 *   onClear={handleClear}
 *   hasActiveFilters={activeCount > 0}
 * >
 *   <HuemulField type="select" label="Status" ... />
 *   <HuemulField type="async-select" label="Owner" ... />
 * </HuemulFilters>
 * ```
 */
export function HuemulFilters({
  children,
  title,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onRefresh,
  isRefreshing = false,
  onApply,
  onClear,
  hasActiveFilters = false,
  className,
}: HuemulFiltersProps) {
  const { t } = useTranslation("huemul-filters");

  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    controlledOnOpenChange?.(next);
  };

  const resolvedTitle = title ?? t("title", "Filters");

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange} className={cn("shrink-0", className)}>
      {/* ── Header row ── */}
      <div className="flex items-center justify-between mb-2">
        <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-foreground hover:cursor-pointer">
          <ChevronDown
            className={cn("h-4 w-4 transition-transform duration-200", !isOpen && "-rotate-90")}
          />
          {resolvedTitle}
        </CollapsibleTrigger>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-accent hover:cursor-pointer transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            {t("refresh", "Refresh")}
          </button>
        )}
      </div>

      {/* ── Collapsible content ── */}
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        <div className="rounded-lg border bg-background p-3">
          <div className="flex flex-wrap items-end gap-3">
            {children}

            {/* ── Actions ── */}
            {(onApply || (onClear && hasActiveFilters)) && (
              <>
                <div className="flex-1" />
                <div className="flex items-end gap-1.5 pb-0.5">
                  {onClear && hasActiveFilters && (
                    <HuemulButton
                      variant="ghost"
                      size="sm"
                      icon={X}
                      label={t("clearAll", "Clear all")}
                      onClick={onClear}
                      className="h-8 text-xs text-muted-foreground"
                    />
                  )}
                  {onApply && (
                    <HuemulButton
                      size="sm"
                      label={t("apply", "Apply")}
                      onClick={onApply}
                      className="h-8 text-xs px-4"
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
