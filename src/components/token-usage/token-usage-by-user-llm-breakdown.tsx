import { useQueries } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Skeleton } from "@/components/ui/skeleton"
import { getTokenUsageStats } from "@/services/token-usage"
import { tokenUsageQueryKeys } from "@/hooks/useTokenUsage"
import { formatTokens, formatUsd } from "@/lib/format-tokens"
import type { TokenUsageActiveLLM, TokenUsageByUser } from "@/types/token-usage"

export interface TokenUsageByUserLlmBreakdownProps {
  user: TokenUsageByUser
  organizationId: string
  dateFrom: string
  dateTo: string
  /** Catálogo de LLMs activos de la org (viene de `/token-usage/summary`), para
   *  resolver `llms_used` (internal_name) al `id` que exige `getTokenUsageStats`. */
  activeLlms: TokenUsageActiveLLM[]
}

/**
 * Contenido de la fila expandida del tab "Por usuario": desglose de tokens y
 * costo por cada LLM usado, vía `GET /token-usage/stats` (un request pequeño
 * por LLM, on-demand al expandir).
 */
export function TokenUsageByUserLlmBreakdown({
  user,
  organizationId,
  dateFrom,
  dateTo,
  activeLlms,
}: TokenUsageByUserLlmBreakdownProps) {
  const { t } = useTranslation("token-usage")

  // llms_used trae internal_name; si alguno no resuelve a un LLM activo del
  // catálogo (p. ej. fue desactivado), se omite de este desglose.
  const llms = user.llms_used
    .map((internalName) => activeLlms.find((l) => l.internal_name === internalName))
    .filter((l): l is TokenUsageActiveLLM => !!l)

  const results = useQueries({
    queries: llms.map((llm) => ({
      queryKey: tokenUsageQueryKeys.stats(organizationId, {
        user_id: user.user_id,
        llm_id: llm.id,
        date_from: dateFrom,
        date_to: dateTo,
      }),
      queryFn: () =>
        getTokenUsageStats(organizationId, {
          user_id: user.user_id,
          llm_id: llm.id,
          date_from: dateFrom,
          date_to: dateTo,
        }),
      staleTime: 2 * 60 * 1000,
      retry: 0,
    })),
  })

  const isLoading = results.some((r) => r.isLoading)
  const hasError = results.some((r) => r.isError)

  return (
    <div className="px-4 py-3 pl-12">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{t("breakdown.title")}</p>
      {isLoading ? (
        <div className="space-y-1.5">
          {llms.map((llm) => (
            <Skeleton key={llm.id} className="h-4 w-48" />
          ))}
        </div>
      ) : hasError ? (
        <p className="text-xs text-destructive">{t("breakdown.loadError")}</p>
      ) : (
        <div className="space-y-1.5">
          {llms.map((llm, i) => {
            const stats = results[i].data
            return (
              <div key={llm.id} className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{llm.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatTokens(stats?.total_tokens)} · {formatUsd(stats?.total_cost)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
