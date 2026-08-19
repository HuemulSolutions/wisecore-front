import {
  MULTI_SELECT_QUESTION_TYPES,
  QUESTION_TYPE,
  SINGLE_SELECT_QUESTION_TYPES,
  hasAnswer,
  isFieldAnswerable,
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
