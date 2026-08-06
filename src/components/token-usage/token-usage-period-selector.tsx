import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { HuemulField } from "@/huemul/components/huemul-field"

export type TokenUsagePeriodPreset = "thisMonth" | "last3Months" | "custom"

export interface TokenUsagePeriodSelectorProps {
  preset: TokenUsagePeriodPreset
  onPresetChange: (preset: TokenUsagePeriodPreset) => void
  customFrom?: string
  customTo?: string
  onCustomRangeChange: (from: string, to: string) => void
}

/**
 * Selector de período: pastillas segmentadas (Este mes / Últimos 3 meses /
 * Personalizado) + un date-range picker que aparece solo con "Personalizado".
 * Vive únicamente acá (no se duplica en el panel de filtros).
 */
export function TokenUsagePeriodSelector({
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomRangeChange,
}: TokenUsagePeriodSelectorProps) {
  const { t } = useTranslation("token-usage")

  const baseClass = "h-8 rounded-sm px-3 text-xs font-medium transition-colors hover:cursor-pointer whitespace-nowrap"
  const activeClass = "bg-primary text-primary-foreground hover:bg-primary/90"
  const inactiveClass = "text-muted-foreground hover:text-foreground hover:bg-accent/40"

  const presets: { key: TokenUsagePeriodPreset; label: string }[] = [
    { key: "thisMonth", label: t("period.thisMonth") },
    { key: "last3Months", label: t("period.last3Months") },
    { key: "custom", label: t("period.custom") },
  ]

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5 rounded-md border p-0.5">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            aria-pressed={preset === p.key}
            onClick={() => onPresetChange(p.key)}
            className={cn(baseClass, preset === p.key ? activeClass : inactiveClass)}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset === "custom" && (
        <HuemulField
          type="date-range"
          dateRangeFrom={customFrom ?? ""}
          dateRangeTo={customTo ?? ""}
          onDateRangeChange={onCustomRangeChange}
          inputClassName="h-8 text-xs w-52"
        />
      )}
    </div>
  )
}
