import { useTranslation } from "react-i18next";
import { FormFieldAnswerValue } from "@/components/sections/form-field-answer-value";
import {
  QUESTION_TYPE,
  hasAnswer,
  isCalculatedField,
  isFieldVisible,
} from "@/components/sections/question-type-meta";
import { resolvedValueOf } from "@/components/workflow/workflow-section-stats";
import { cn } from "@/lib/utils";
import type { FormFieldValue } from "@/types/sections/core";

export interface FormSectionSummaryAnswersProps {
  /** Campos ya ordenados por `order` — computeSectionStats(section).fields. */
  fields: FormFieldValue[];
  /** Texto de "esta sección no tiene preguntas". Lo traduce el caller. */
  emptyLabel: string;
}

// Ramas de FormFieldAnswerValue cuyo render no es texto plano: el clamp de 3 líneas
// (-webkit-line-clamp, aplicado a un <p>/<span> hijo) las rompe visualmente, así que se omite
// para ellas.
const NON_TEXT_QUESTION_TYPES = new Set<string | undefined>([QUESTION_TYPE.fileUpload, QUESTION_TYPE.rating]);

/**
 * Lista de solo lectura pregunta/respuesta de una sección form: cada fila apila la pregunta
 * arriba y el valor abajo, como la ve quien responde. Compartida por el resumen de workflow y el
 * modo lector del asset (ver form-section-summary-card.tsx). Lista todas las preguntas visibles;
 * las sin responder muestran «Sin respuesta» (los calculados sin valor los resuelve
 * FormFieldAnswerValue). Los `label` (separadores) no se listan.
 */
export function FormSectionSummaryAnswers({ fields, emptyLabel }: FormSectionSummaryAnswersProps) {
  const { t } = useTranslation("sections");
  const rows = fields.filter((f) => isFieldVisible(f) && f.question_type !== QUESTION_TYPE.label);

  if (rows.length === 0) {
    return <p className="pl-[35px] text-[12.5px] text-[#94a3b8]">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-col pl-[35px]">
      {rows.map((field, index) => {
        const clamp = !NON_TEXT_QUESTION_TYPES.has(field.question_type);
        const unanswered = !isCalculatedField(field) && !hasAnswer(resolvedValueOf(field));
        return (
          <div
            key={field.id || index}
            className="flex flex-col gap-[3px] border-b border-[#eef1f6] pb-[8px] pt-[8px] first:pt-0 last:border-b-0 last:pb-0"
          >
            <p className="text-[12.5px] leading-[1.45] text-[#64748b]">
              {field.field_name}
              {field.required && <span className="text-[#b91c1c]"> *</span>}
            </p>
            <div className="min-w-0">
              {unanswered ? (
                <span className="text-[13px] italic leading-[1.45] text-[#94a3b8]">
                  {t("sections:form.fill.noAnswer")}
                </span>
              ) : (
                <FormFieldAnswerValue
                  field={field}
                  textClassName={cn("text-[13px] leading-[1.45] text-[#0f172a]", clamp && "line-clamp-3")}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
