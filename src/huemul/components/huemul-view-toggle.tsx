import { LayoutGrid, List } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { HuemulButton } from "./huemul-button"

export type ViewMode = "grid" | "list"

interface HuemulViewToggleProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
  className?: string
}

/**
 * `HuemulViewToggle` — segmented control to switch a listing between grid and
 * list views. Icon-only buttons; the active mode is highlighted in primary.
 *
 * @example
 * ```tsx
 * <HuemulViewToggle value={viewMode} onChange={setViewMode} />
 * ```
 */
export function HuemulViewToggle({ value, onChange, className }: HuemulViewToggleProps) {
  const { t } = useTranslation("common")

  const baseClass = "h-8 w-8 p-0 rounded-sm transition-colors"
  const activeClass = "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
  const inactiveClass = "text-muted-foreground hover:text-foreground"

  return (
    <div className={cn("flex items-center gap-0.5 rounded-md border p-0.5", className)}>
      <HuemulButton
        size="sm"
        variant="ghost"
        icon={LayoutGrid}
        iconClassName="h-4 w-4"
        tooltip={t("viewGrid")}
        aria-label={t("viewGrid")}
        aria-pressed={value === "grid"}
        onClick={() => onChange("grid")}
        className={cn(baseClass, value === "grid" ? activeClass : inactiveClass)}
      />
      <HuemulButton
        size="sm"
        variant="ghost"
        icon={List}
        iconClassName="h-4 w-4"
        tooltip={t("viewList")}
        aria-label={t("viewList")}
        aria-pressed={value === "list"}
        onClick={() => onChange("list")}
        className={cn(baseClass, value === "list" ? activeClass : inactiveClass)}
      />
    </div>
  )
}
