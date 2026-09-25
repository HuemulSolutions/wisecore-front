/** Format a token count into a compact human-readable string (1,240k / 4.2M). */
export function formatTokens(tokens?: number | null): string {
  if (tokens == null) return "—"
  if (tokens < 1_000) return String(tokens)
  if (tokens < 1_000_000) return `${(tokens / 1_000).toLocaleString("en-US", { maximumFractionDigits: 0 })}k`
  return `${(tokens / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}M`
}

/**
 * Format an estimated USD cost. `value` llega como decimal serializado (string) o `null`
 * cuando ningún registro del rango tiene precio — ver `TokenUsageSummary.estimated_cost_usd`.
 */
export function formatUsd(value?: string | number | null): string {
  if (value == null) return "—"
  const num = typeof value === "string" ? Number(value) : value
  if (Number.isNaN(num)) return "—"
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Format a unit price in USD (e.g. por 1M de tokens). Hasta 4 decimales para no
 * redondear tarifas finas como 0.075 — ver `LLM.input_price_per_1m_tokens`.
 */
export function formatUsdPrecise(value?: string | number | null): string {
  if (value == null) return "—"
  const num = typeof value === "string" ? Number(value) : value
  if (Number.isNaN(num)) return "—"
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
}
