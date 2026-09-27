import { format, parseISO } from 'date-fns'
import { ar, de, enUS, es, fr, it, ja, ptBR, zhCN, type Locale } from 'date-fns/locale'
import type { HuemulDateRangeValue } from '@/types/huemul'

// ── Browser locale helper ─────────────────────────────────────────────────
// Mirrors the resolution used inside huemul-field's DateRangeField so chip text
// and the in-panel control agree on the displayed format.

const DATE_FNS_LOCALE_MAP: Record<string, Locale> = {
  ar, de, fr, it, ja,
  es, 'es-419': es, 'es-AR': es, 'es-MX': es, 'es-CL': es, 'es-CO': es,
  en: enUS, 'en-US': enUS, 'en-GB': enUS, 'en-AU': enUS,
  pt: ptBR, 'pt-BR': ptBR, 'pt-PT': ptBR,
  zh: zhCN, 'zh-CN': zhCN, 'zh-TW': zhCN,
}

export function getBrowserDateLocale(): Locale {
  const lang = typeof navigator !== 'undefined' ? navigator.language : 'en'
  return DATE_FNS_LOCALE_MAP[lang]
    ?? DATE_FNS_LOCALE_MAP[lang.split('-')[0]]
    ?? enUS
}

/**
 * Numeric date pattern (e.g. "27/06/2024") used for both the editable date
 * inputs in the filter control and the active-filter chips, so they stay in
 * sync. Fixed (locale-independent) on purpose.
 */
export const NUMERIC_DATE_PATTERN = 'dd/MM/yyyy'

export interface FormatDateRangeLabels {
  /** Prefix when only the "from" bound is set (e.g. "Desde"). */
  fromLabel: string
  /** Prefix when only the "to" bound is set (e.g. "Hasta"). */
  toLabel: string
  locale?: Locale
}

/**
 * Format a {@link HuemulDateRangeValue} into a compact human-readable string.
 * Returns an empty string when no bound is set.
 */
export function formatDateRangeValue(
  value: HuemulDateRangeValue | undefined,
  { fromLabel, toLabel, locale = getBrowserDateLocale() }: FormatDateRangeLabels,
): string {
  if (!value) return ''
  const { date, from, to } = value

  if (date) return format(parseISO(date), NUMERIC_DATE_PATTERN, { locale })

  if (from && to) {
    const f = parseISO(from)
    const t = parseISO(to)
    return `${format(f, NUMERIC_DATE_PATTERN, { locale })} – ${format(t, NUMERIC_DATE_PATTERN, { locale })}`
  }

  if (from) return `${fromLabel} ${format(parseISO(from), NUMERIC_DATE_PATTERN, { locale })}`
  if (to) return `${toLabel} ${format(parseISO(to), NUMERIC_DATE_PATTERN, { locale })}`

  return ''
}
