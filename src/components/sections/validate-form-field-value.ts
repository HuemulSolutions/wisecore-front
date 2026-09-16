import type { FormFieldValue } from "@/types/sections/core";
import { NUMERIC_DATA_TYPES, QUESTION_TYPE, hasAnswer, readFileUploadLimits } from "./question-type-meta";

// Validación (cliente) del VALOR de una respuesta contra los constraints del campo
// (min_value/max_value/entero/formato email). Corre en el runtime de llenado del
// formulario (asset-form-section.tsx), justo antes de autoguardar — no confundir con
// validate-form-field-dependencies.ts, que valida la config de depends_on en el builder.
// required se maneja aparte (bloquea salir de edición, no el autosave de este campo).
export type FormFieldValueErrorKey =
  | "invalidEmail"
  | "invalidInteger"
  | "valueTooSmall"
  | "valueTooBig"
  | "tooFewFiles"
  | "tooManyFiles";

export interface FormFieldValueError {
  key: FormFieldValueErrorKey;
  params?: Record<string, unknown>;
}

const NUMERIC_QUESTION_TYPES: string[] = [
  QUESTION_TYPE.number,
  QUESTION_TYPE.decimal,
  QUESTION_TYPE.linearScale,
  QUESTION_TYPE.rating,
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// null = valor válido (o vacío, que no se valida acá). Un objeto = error a traducir
// con t(`form.fill.${key}`, params).
export function validateFormFieldValue(field: FormFieldValue, value: unknown): FormFieldValueError | null {
  if (!hasAnswer(value)) return null;

  const questionType = field.question_type ?? "";

  if (NUMERIC_QUESTION_TYPES.includes(questionType) || NUMERIC_DATA_TYPES.includes(field.data_type as string)) {
    const n = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(n)) return null; // formato no numérico: fuera de alcance de esta validación

    if (field.data_type === "int" && !Number.isInteger(n)) {
      return { key: "invalidInteger" };
    }
    if (typeof field.min_value === "number" && n < field.min_value) {
      return { key: "valueTooSmall", params: { min: field.min_value } };
    }
    if (typeof field.max_value === "number" && n > field.max_value) {
      return { key: "valueTooBig", params: { max: field.max_value } };
    }
    return null;
  }

  if (questionType === QUESTION_TYPE.email && typeof value === "string" && !EMAIL_RE.test(value)) {
    return { key: "invalidEmail" };
  }

  // carga_de_archivos: value es siempre un array de tokens (contrato de backend).
  if (questionType === QUESTION_TYPE.fileUpload) {
    const list = Array.isArray(value) ? value : [value];
    const { min, max } = readFileUploadLimits(field);
    if (list.length < min) return { key: "tooFewFiles", params: { min } };
    if (list.length > max) return { key: "tooManyFiles", params: { max } };
  }

  return null;
}
