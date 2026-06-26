import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import type { HuemulFilterChipsProps } from "@/types/huemul";
export type { HuemulFilterChipsProps };

/**
 * `HuemulFilterChips` — renders the currently applied filters as removable chips,
 * plus a "Clear all" action. Renders nothing when there are no active filters.
 *
 * @example
 * ```tsx
 * <HuemulFilterChips chips={chips} onRemove={clearValue} onClearAll={clearAll} />
 * ```
 */
export function HuemulFilterChips({
  chips,
  onRemove,
  onClearAll,
  className,
}: HuemulFilterChipsProps) {
  const { t } = useTranslation(["huemul-filters", "common"]);

  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 py-1 pl-3 pr-1.5 text-xs font-medium text-foreground"
        >
          <span className="truncate max-w-[16rem]">{chip.label}</span>
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            aria-label={t("common:close", "Close")}
            className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground hover:cursor-pointer"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:cursor-pointer"
      >
        {t("clearAll", "Clear all")}
      </button>
    </div>
  );
}
