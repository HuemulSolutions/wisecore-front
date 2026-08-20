import {
  MULTI_SELECT_QUESTION_TYPES,
  QUESTION_TYPE,
  SINGLE_SELECT_QUESTION_TYPES,
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
  // Solo preguntas visibles: una oculta por depends_on no está en pantalla,
  // así que tampoco debe sumar al total del contador "respondidas/total".
  const questions = fields.filter((f) => f.question_type !== QUESTION_TYPE.label && isFieldVisible(f));
  const answeredCount = questions.filter((f) => hasAnswer(resolvedValueOf(f))).length;
  // Una sección `access: 'view'` (ver template_section_lifecycle_access) no se
  // puede responder aunque el backend no haya marcado cada campo con
  // `can_answer: false` individualmente — sin este corte, sus obligatorios sin
  // valor quedarían "pendientes" para siempre en el resumen del wizard.
  const missingRequired =
    section.access === "view"
      ? 0
      : questions.filter((f) => isFieldAnswerable(f) && f.required && !hasAnswer(resolvedValueOf(f))).length;
  return { fields, questions, answeredCount, missingRequired };
}

// Espejo cliente de la regla del backend: una sección form sin ninguna pregunta
// visible "no aplica". El backend ya no la devuelve en /content; este helper cubre
// el intervalo entre el parche de caché del PATCH /form_values y el próximo refetch.
export function isFormSectionApplicable(section: ContentSection): boolean {
  if (section.section_type !== "form") return true;
  return (section.form_fields ?? []).some(
    (f) => f.question_type !== QUESTION_TYPE.label && isFieldVisible(f),
  );
}
