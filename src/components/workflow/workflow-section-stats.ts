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

export interface SummaryTotals {
  sectionsAnswered: number;
  sectionsTotal: number;
  questionsAnswered: number;
  questionsTotal: number;
  missingRequired: number;
}

// Agregados de todas las secciones, para el strip de métricas del resumen. sectionsAnswered
// usa review_status === 'finished' — la misma señal que HuemulReviewStatusBadge — para que
// el strip nunca contradiga el badge de cada tarjeta.
export function computeSummaryTotals(sections: ContentSection[]): SummaryTotals {
  return sections.reduce<SummaryTotals>(
    (totals, section) => {
      const { questions, answeredCount, missingRequired } = computeSectionStats(section);
      return {
        sectionsAnswered: totals.sectionsAnswered + (section.review_status === "finished" ? 1 : 0),
        sectionsTotal: totals.sectionsTotal + 1,
        questionsAnswered: totals.questionsAnswered + answeredCount,
        questionsTotal: totals.questionsTotal + questions.length,
        missingRequired: totals.missingRequired + missingRequired,
      };
    },
    { sectionsAnswered: 0, sectionsTotal: 0, questionsAnswered: 0, questionsTotal: 0, missingRequired: 0 },
  );
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
