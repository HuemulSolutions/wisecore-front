import type { TFunction } from "i18next"
import { QUESTION_TYPE, readFileUploadLimits } from "@/components/sections/question-type-meta"

/**
 * Valida el borrador en edición del sheet (value: string | string[], un solo
 * campo). Contraparte para el registro persistido CustomFieldDocument (con
 * columnas tipadas, donde 0/false son valores válidos):
 * src/lib/custom-field-required-utils.ts — si cambian las reglas de
 * "obligatorio sin valor", tocar los dos.
 */
interface ValidateCustomFieldValueParams {
  dataType: string
  questionType?: string
  value: string | string[]
  required?: boolean
  minValue?: unknown
  maxValue?: unknown
  /** carga_de_archivos: cantidad actual de archivos (value_files o el legado value_blob
   *  singular) — el value en sí siempre viaja vacío, los archivos se gestionan aparte. */
  fileCount?: number
  t: TFunction
}

export function validateCustomFieldValue({ dataType, questionType, value, required, minValue, maxValue, fileCount, t }: ValidateCustomFieldValueParams): string | undefined {
  if (questionType === QUESTION_TYPE.fileUpload) {
    const count = fileCount ?? 0
    if (required && count === 0) return t('addDialog.valueRequired')
    if (count === 0) return undefined
    const { min, max } = readFileUploadLimits({ min_value: minValue, max_value: maxValue })
    if (count < min) return t('sections:form.fill.tooFewFiles', { min })
    if (count > max) return t('sections:form.fill.tooManyFiles', { max })
    return undefined
  }

  if (Array.isArray(value)) {
    if (required && value.length === 0) return t('addDialog.valueRequired')
    return undefined
  }

  const trimmed = value.trim()

  if (required && !trimmed) return t('addDialog.valueRequired')
  if (!trimmed) return undefined

  if (questionType === QUESTION_TYPE.email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? undefined : t('addDialog.invalidEmail')
  }

  const min = typeof minValue === "number" ? minValue : undefined
  const max = typeof maxValue === "number" ? maxValue : undefined

  switch (dataType) {
    case "int": {
      if (!/^-?\d+$/.test(trimmed)) return t('addDialog.invalidInteger')
      const n = Number(trimmed)
      if (min !== undefined && n < min) return t('addDialog.valueTooSmall', { min })
      if (max !== undefined && n > max) return t('addDialog.valueTooBig', { max })
      return undefined
    }
    case "decimal": {
      if (Number.isNaN(Number(trimmed))) return t('addDialog.invalidDecimal')
      const n = Number(trimmed)
      if (min !== undefined && n < min) return t('addDialog.valueTooSmall', { min })
      if (max !== undefined && n > max) return t('addDialog.valueTooBig', { max })
      return undefined
    }
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
