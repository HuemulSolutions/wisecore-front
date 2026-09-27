import { MULTI_SELECT_QUESTION_TYPES } from "@/components/sections/question-type-meta"
import type { CustomFieldDocument } from "@/types/custom-fields"

/**
 * Reglas de "sin valor" del backend para custom fields de documento marcados
 * `required: true`. Se validan al salir de `draft` (POST .../advance y
 * .../steps/{id}/complete cuando dispara el auto-avance) y al pasar
 * `in_approval -> approved`. Código de error:
 * CUSTOM_FIELD_DOCUMENT_REQUIRED_VALUE_MISSING.
 *
 * Contraparte para el borrador en edición (value: string | string[]):
 * src/components/custom-fields/custom-field-value-validation.ts — si cambian
 * las reglas, tocar los dos.
 */

/** Subconjunto de CustomFieldDocument que alcanza para decidir si hay valor. */
export type CustomFieldValueShape = Pick<
  CustomFieldDocument,
  | "data_type"
  | "question_type"
  | "value"
  | "value_identifier"
  | "value_list"
  | "value_number"
  | "value_bool"
  | "value_date"
  | "value_time"
  | "value_datetime"
  | "value_url"
  | "selected_option"
  | "selected_options"
>

const hasText = (v: string | null | undefined): boolean => typeof v === "string" && v.trim() !== ""

/**
 * Sesgo deliberado: falsos negativos antes que falsos positivos. Cada rama
 * tipada cae en `&& !hasText(field.value)` como red de seguridad (`value` es
 * el string genérico que el backend siempre llena) — si la columna tipada
 * viene vacía pero `value` trae algo, se prefiere NO marcarlo como faltante.
 * Un falso negativo cuesta un diálogo reactivo (igualmente correcto); un
 * falso positivo diría "llená este campo" sobre un campo ya lleno.
 * Excepción intencional: `image`, donde la regla del backend es
 * estrictamente `value_identifier` (el `value` puede traer una URL firmada)
 * — sin conjunción.
 */
export function isCustomFieldValueMissing(field: CustomFieldValueShape): boolean {
  switch (field.data_type) {
    case "list": {
      // multi-select: lista vacía. Prioriza selected_options (resuelto por el
      // backend) sobre value_list (legacy) — mismo criterio que getListLabels
      // en assets-custom-fields-list.tsx.
      if (MULTI_SELECT_QUESTION_TYPES.includes(field.question_type ?? "")) {
        return (field.selected_options?.length ?? 0) === 0 && (field.value_list?.length ?? 0) === 0
      }
      // single-select: null o solo whitespace
      if (field.selected_option) return false
      return !hasText(field.value_identifier) && !hasText(field.value)
    }
    case "image":
      return !hasText(field.value_identifier)
    case "int":
    case "decimal":
      return field.value_number === null || field.value_number === undefined ? !hasText(field.value) : false
    case "date":
      return !hasText(field.value_date) && !hasText(field.value)
    case "time":
      return !hasText(field.value_time) && !hasText(field.value)
    case "datetime":
      return !hasText(field.value_datetime) && !hasText(field.value)
    case "bool":
      return field.value_bool === null || field.value_bool === undefined ? !hasText(field.value) : false
    case "url":
      return !hasText(field.value_url) && !hasText(field.value)
    case "string":
    default:
      return !hasText(field.value)
  }
}

export function getMissingRequiredCustomFields<T extends CustomFieldValueShape & { required: boolean }>(
  fields: T[] | null | undefined,
): T[] {
  return (fields ?? []).filter((f) => f.required && isCustomFieldValueMissing(f))
}

export function getMissingRequiredCustomFieldNames(
  fields: (CustomFieldValueShape & { required: boolean; name: string })[] | null | undefined,
): string[] {
  return getMissingRequiredCustomFields(fields).map((f) => f.name)
}

/**
 * El detail de CUSTOM_FIELD_DOCUMENT_REQUIRED_VALUE_MISSING es texto libre,
 * no JSON (parseErrorDetail de error-utils.ts no aplica):
 *
 *   "Cannot transition execution from draft to the next lifecycle state
 *    because document 'Manual de calidad' has required custom fields without
 *    value: Nombre del campo, Otro campo"
 *
 * Se parsea best-effort: es el fallback de la lista calculada localmente, no
 * la fuente principal. Cualquier cambio de wording degrada a lista vacía y
 * el llamador cae al toast genérico (nunca a un diálogo vacío).
 *
 * Limitación conocida: un nombre de campo que contenga coma se parte en dos
 * — inevitable con detail de texto libre, y es justamente por eso que este
 * camino es el fallback y no la fuente principal.
 */
const WITHOUT_VALUE_RE = /without value:\s*([\s\S]+)$/i
const DOCUMENT_NAME_RE = /document\s+'([^']*)'/i

export interface MissingRequiredCustomFieldsDetail {
  /** Documento que el backend nombró en el detail, si se pudo extraer. */
  documentName: string | null
  fieldNames: string[]
}

export function parseMissingRequiredCustomFieldsDetail(
  detail: string | null | undefined,
): MissingRequiredCustomFieldsDetail {
  const documentName = detail ? (DOCUMENT_NAME_RE.exec(detail)?.[1] ?? null) : null
  const match = detail ? WITHOUT_VALUE_RE.exec(detail) : null
  if (!match) return { documentName, fieldNames: [] }

  const fieldNames = match[1]
    .replace(/[.\s]+$/, "") // punto final / saltos de línea
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  return { documentName, fieldNames: Array.from(new Set(fieldNames)) }
}
