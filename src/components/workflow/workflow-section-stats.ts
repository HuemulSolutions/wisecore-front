import type { TFunction } from "i18next";
import {
  LABEL_QUESTION_TYPE,
  MULTI_SELECT_QUESTION_TYPES,
  QUESTION_TYPE,
  SINGLE_SELECT_QUESTION_TYPES,
  formatFieldValueForCopy,
  hasAnswer,
  isFieldAnswerable,
  isFieldVisible,
  normalizeSelectionValue,
} from "@/components/sections/question-type-meta";
import type { ContentSection } from "@/types/assets";
import type { FormFieldValue } from "@/types/sections/core";

// El backend inicializa value = default_value (las opciones de config) en campos de
// selección sin responder — sin normalizar, hasAnswer() los cuenta como respondidos.
// Mismo criterio que FormFieldAnswerValue (ver form-field-answer-value.tsx:41-48).
export function resolvedValueOf(field: FormFieldValue): unknown {
  const isMulti = MULTI_SELECT_QUESTION_TYPES.includes(field.question_type ?? "");
  const isSingle = SINGLE_SELECT_QUESTION_TYPES.includes(field.question_type ?? "");
  return isMulti || isSingle ? normalizeSelectionValue(field.value, isMulti) : field.value;
}

export interface SectionStats {
  fields: FormFieldValue[];
  questions: FormFieldValue[];
  answeredCount: number;
  missingRequired: number;
}

export function computeSectionStats(section: ContentSection): SectionStats {
  const fields = [...(section.form_fields ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const questions = fields.filter((f) => f.question_type !== QUESTION_TYPE.label);
  const answeredCount = questions.filter((f) => hasAnswer(resolvedValueOf(f))).length;
  const missingRequired = questions.filter(
    (f) => isFieldAnswerable(f) && f.required && !hasAnswer(resolvedValueOf(f)),
  ).length;
  return { fields, questions, answeredCount, missingRequired };
}

// Texto plano para copiar al portapapeles — mismo formateo que "Copiar" en
// asset-form-section.tsx / assets-section.tsx (ver handleCopy, assets-section.tsx:226-246):
// campos visibles, ordenados por `order`, `etiqueta` solo con el título, el resto
// "nombre: valor" vía formatFieldValueForCopy (no reimplementar el formateo por question_type).
export function serializeSectionAnswers(section: ContentSection, t: TFunction): string {
  return [...(section.form_fields ?? [])]
    .filter(isFieldVisible)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((field) =>
      field.question_type === LABEL_QUESTION_TYPE
        ? formatFieldValueForCopy(field, t)
        : `${field.field_name}: ${formatFieldValueForCopy(field, t)}`,
    )
    .join("\n");
}
