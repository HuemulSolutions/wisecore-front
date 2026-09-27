import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { getOrganizationDailyModelTelemetryList } from "@/services/organization-daily-model-telemetry"
import { organizationDailyModelTelemetryQueryKeys } from "@/hooks/useOrganizationDailyModelTelemetry"
import type { OrganizationDailyModelTelemetry } from "@/types/organization-daily-model-telemetry"

// Tope de páginas a recorrer (100 filas c/u) mientras no exista un endpoint de
// serie temporal propio de token-usage con filtro de fecha en servidor. 5
// páginas ≈ 500 filas: de sobra para ~3 meses × unos pocos modelos activos.
// Si se alcanza el tope, `truncated` avisa para no ocultarlo en silencio.
const MAX_PAGES = 5
const PAGE_SIZE = 100

export interface TokenUsageDailyPoint {
  /** YYYY-MM-DD */
  date: string
  tokens: number
}

export interface UseTokenUsageDailySeriesOptions {
  organizationId: string
  dateFrom: string
  dateTo: string
  /** Si se pasa, la serie se acota a este LLM. */
  llmId?: string
  enabled?: boolean
}

async function fetchAllTelemetry(organizationId: string): Promise<{
  rows: OrganizationDailyModelTelemetry[]
  truncated: boolean
}> {
  const rows: OrganizationDailyModelTelemetry[] = []
  let page = 1
  let hasNext = true
  let truncated = false

  while (hasNext && page <= MAX_PAGES) {
    const res = await getOrganizationDailyModelTelemetryList({
      organization_id: organizationId,
      page,
      page_size: PAGE_SIZE,
    })
    rows.push(...res.data)
    hasNext = res.has_next
    if (hasNext && page === MAX_PAGES) truncated = true
    page += 1
  }

  return { rows, truncated }
}

/**
 * Serie diaria de tokens consumidos por la organización, derivada de
 * `organization-daily-model-telemetry` (poblado por un cron diario). El
 * endpoint no filtra por fecha ni LLM en servidor, así que el rango y el LLM
 * se aplican acá; los días sin registro se rellenan en 0 para que la línea
 * del gráfico no salte.
 */
export function useTokenUsageDailySeries({
  organizationId,
  dateFrom,
  dateTo,
  llmId,
  enabled = true,
}: UseTokenUsageDailySeriesOptions) {
  const query = useQuery({
    // Prefijo compartido con `organizationDailyModelTelemetryQueryKeys.listBase()`:
    // invalidar esa base (p. ej. desde el refresh de la página) invalida también
    // este fetch-all-paginado.
    queryKey: [...organizationDailyModelTelemetryQueryKeys.listBase(), "all", organizationId],
    queryFn: () => fetchAllTelemetry(organizationId),
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })

  const points = useMemo<TokenUsageDailyPoint[]>(() => {
    const rows = query.data?.rows ?? []
    const totalsByDate = new Map<string, number>()

    for (const row of rows) {
      if (row.date < dateFrom || row.date > dateTo) continue
      if (llmId && row.llm_id !== llmId) continue
      const tokens = row.total_input_tokens + row.total_output_tokens
      totalsByDate.set(row.date, (totalsByDate.get(row.date) ?? 0) + tokens)
    }

    const result: TokenUsageDailyPoint[] = []
    const cursor = new Date(`${dateFrom}T00:00:00Z`)
    const end = new Date(`${dateTo}T00:00:00Z`)
    while (cursor.getTime() <= end.getTime()) {
      const iso = cursor.toISOString().slice(0, 10)
      result.push({ date: iso, tokens: totalsByDate.get(iso) ?? 0 })
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    return result
  }, [query.data, dateFrom, dateTo, llmId])

  return {
    points,
    truncated: query.data?.truncated ?? false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  }
}
