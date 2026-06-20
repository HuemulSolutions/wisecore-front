import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDateRangeValue } from '@/lib/format-date-range'
import type {
  HuemulDateRangeValue,
  HuemulFilterChip,
  HuemulFilterDef,
  HuemulFilterValue,
  HuemulFilterValues,
  UseHuemulFiltersConfig,
  UseHuemulFiltersReturn,
} from '@/types/huemul'

export type { UseHuemulFiltersConfig, UseHuemulFiltersReturn }

/** The "empty" (cleared) value for a filter definition. */
function emptyValue(def: HuemulFilterDef): HuemulFilterValue {
  switch (def.type) {
    case 'select':
      return def.allValue ?? ''
    case 'boolean':
      return def.defaultValue ?? false
    case 'date-range':
      return undefined
    default:
      return ''
  }
}

/** Whether a value counts as an active (applied) filter. */
function isActive(def: HuemulFilterDef, value: HuemulFilterValue): boolean {
  switch (def.type) {
    case 'select':
      return typeof value === 'string' && value !== '' && value !== def.allValue
    case 'async-select':
    case 'text':
      return typeof value === 'string' && value.trim() !== ''
    case 'boolean':
      return value === (def.activeWhen ?? true)
    case 'date-range': {
      const v = value as HuemulDateRangeValue | undefined
      return !!(v && (v.date || v.from || v.to))
    }
    default:
      return false
  }
}

/**
 * `useHuemulFilters` — config-driven state for the faceted filter panel.
 *
 * Holds a flat `values` record keyed by filter `key`, the panel `open` state,
 * and a cache of resolved labels for async-select chips. Filters apply
 * instantly (the returned `values` are meant to drive the query directly).
 */
export function useHuemulFilters({
  filters,
  defaultOpen = false,
  initialValues,
}: UseHuemulFiltersConfig): UseHuemulFiltersReturn {
  const { t } = useTranslation('common')

  const defsByKey = useMemo(() => {
    const map = new Map<string, HuemulFilterDef>()
    for (const def of filters) map.set(def.key, def)
    return map
  }, [filters])

  const emptyValues = useMemo<HuemulFilterValues>(() => {
    const out: HuemulFilterValues = {}
    for (const def of filters) out[def.key] = emptyValue(def)
    return out
  }, [filters])

  const [values, setValues] = useState<HuemulFilterValues>(() => ({
    ...emptyValues,
    ...initialValues,
  }))
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>({})
  const [open, setOpen] = useState(defaultOpen)

  const setValue = useCallback((key: string, value: HuemulFilterValue) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setSelectedLabel = useCallback((key: string, label?: string) => {
    setSelectedLabels((prev) => {
      if (label === undefined) {
        if (!(key in prev)) return prev
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: label }
    })
  }, [])

  const clearValue = useCallback(
    (key: string) => {
      const def = defsByKey.get(key)
      setValues((prev) => ({ ...prev, [key]: def ? emptyValue(def) : '' }))
      setSelectedLabel(key, undefined)
    },
    [defsByKey, setSelectedLabel],
  )

  const clearAll = useCallback(() => {
    setValues({ ...emptyValues })
    setSelectedLabels({})
  }, [emptyValues])

  const chips = useMemo<HuemulFilterChip[]>(() => {
    const result: HuemulFilterChip[] = []
    for (const def of filters) {
      if (def.toolbar || def.hidden) continue
      const value = values[def.key]
      if (!isActive(def, value)) continue

      let label: string
      switch (def.type) {
        case 'select': {
          const opt = def.options.find((o) => o.value === value)
          label = `${def.label}: ${opt?.label ?? value}`
          break
        }
        case 'async-select': {
          const resolved = selectedLabels[def.key]
          label = `${def.label}: ${resolved ?? value}`
          break
        }
        case 'text':
          label = `${def.label}: ${value}`
          break
        case 'boolean':
          label = def.chipLabel ?? def.label
          break
        case 'date-range': {
          const formatted = formatDateRangeValue(value as HuemulDateRangeValue, {
            fromLabel: t('dateFrom'),
            toLabel: t('dateTo'),
          })
          label = `${def.label}: ${formatted}`
          break
        }
      }

      result.push({ key: def.key, label })
    }
    return result
  }, [filters, values, selectedLabels, t])

  const activeCount = chips.length

  return {
    values,
    setValue,
    clearValue,
    clearAll,
    activeCount,
    chips,
    open,
    setOpen,
    setSelectedLabel,
  }
}
