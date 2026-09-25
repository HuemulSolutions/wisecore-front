import { useTranslation } from "react-i18next"
import { HuemulMetricCard } from "@/huemul/components/huemul-metric-card"
import { formatTokens, formatUsd } from "@/lib/format-tokens"
import type { TokenUsageSummary } from "@/types/token-usage"

export interface TokenUsageSummaryCardsProps {
  summary?: TokenUsageSummary
  loading: boolean
  periodLabel: string
}

/** Las 4 KPI cards del rango seleccionado: tokens, costo, LLMs activos y usuarios activos. */
export function TokenUsageSummaryCards({ summary, loading, periodLabel }: TokenUsageSummaryCardsProps) {
  const { t } = useTranslation("token-usage")

  const hasPartialCoverage = !!summary && summary.cost_coverage.unpriced_tokens > 0
  const activeLlmNames = summary?.active_llms.map((l) => l.name).join(" · ")

  return (
    <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
      <HuemulMetricCard
        label={t("metrics.tokensConsumed")}
        value={formatTokens(summary?.total_tokens)}
        subtitle={periodLabel}
        loading={loading}
      />
      <HuemulMetricCard
        label={t("metrics.estimatedCost")}
        value={formatUsd(summary?.estimated_cost_usd)}
        subtitle={hasPartialCoverage ? t("metrics.partialCoverage") : t("metrics.estimatedCostSubtitle")}
        loading={loading}
      />
      <HuemulMetricCard
        label={t("metrics.activeLlms")}
        value={String(summary?.active_llms_count ?? 0)}
        subtitle={activeLlmNames || undefined}
        loading={loading}
      />
      <HuemulMetricCard
        label={t("metrics.activeUsers")}
        value={String(summary?.active_users_count ?? 0)}
        subtitle={t("metrics.activeUsersSubtitle")}
        loading={loading}
      />
    </div>
  )
}
