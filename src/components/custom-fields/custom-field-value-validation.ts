import type { TFunction } from "i18next"

interface ValidateCustomFieldValueParams {
  dataType: string
  value: string | string[]
  required?: boolean
  t: TFunction
}

export function validateCustomFieldValue({ dataType, value, required, t }: ValidateCustomFieldValueParams): string | undefined {
  if (Array.isArray(value)) {
    if (required && value.length === 0) return t('addDialog.valueRequired')
    return undefined
  }

  const trimmed = value.trim()

  if (required && !trimmed) return t('addDialog.valueRequired')
  if (!trimmed) return undefined

  switch (dataType) {
    case "int":
      return /^-?\d+$/.test(trimmed) ? undefined : t('addDialog.invalidInteger')
    case "decimal":
      return Number.isNaN(Number(trimmed)) ? t('addDialog.invalidDecimal') : undefined
    case "url":
      try { new URL(trimmed); return undefined } catch { return t('addDialog.invalidUrl') }
    case "date":
    case "datetime":
      return Number.isNaN(Date.parse(trimmed)) ? t('addDialog.invalidDate') : undefined
    case "time":
      return /^\d{2}:\d{2}(:\d{2})?$/.test(trimmed) ? undefined : t('addDialog.invalidTime')
    default:
      return undefined
  }
}
