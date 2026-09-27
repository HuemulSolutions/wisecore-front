import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { HuemulButton } from "./huemul-button";

import type { HuemulFilterButtonProps } from "@/types/huemul";
export type { HuemulFilterButtonProps };

/**
 * `HuemulFilterButton` — toolbar button that toggles the filter panel and shows
 * a badge with the number of applied filters.
 *
 * @example
 * ```tsx
 * <HuemulFilterButton count={activeCount} open={open} onToggle={() => setOpen(o => !o)} />
 * ```
 */
export function HuemulFilterButton({
  count,
  open,
  onToggle,
  label,
  className,
}: HuemulFilterButtonProps) {
  const { t } = useTranslation(["huemul-filters", "common"]);
  const resolvedLabel = label ?? t("title", "Filters");

  return (
    <HuemulButton
      variant={open ? "secondary" : "outline"}
      onClick={onToggle}
      aria-pressed={open}
      className={cn("gap-2", className)}
    >
      <SlidersHorizontal className="size-4" />
      <span>{resolvedLabel}</span>
      {count > 0 && (
        <Badge variant="default" className="ml-0.5 h-5 min-w-5 px-1.5 tabular-nums">
          {count}
        </Badge>
      )}
    </HuemulButton>
  );
}
