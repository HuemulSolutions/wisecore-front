import { FormFieldAnswerValue } from "@/components/sections/form-field-answer-value";
import { QUESTION_TYPE, hasAnswer } from "@/components/sections/question-type-meta";
import { resolvedValueOf } from "@/components/workflow/workflow-section-stats";
import { cn } from "@/lib/utils";
import type { FormFieldValue } from "@/types/sections/core";

export interface WorkflowSummaryAnswersProps {
  /** computeSectionStats(section).questions — ya sin labels, calculados ni ocultos. */
  questions: FormFieldValue[];
  /** Texto de "esta sección aún no tiene respuestas". Lo traduce el caller. */
  emptyLabel: string;
}

// Ramas de FormFieldAnswerValue cuyo render no es texto plano: el clamp de 3 líneas
// (-webkit-line-clamp, aplicado a un <p>/<span> hijo) las rompe visualmente, así que se omite
// para ellas.
const NON_TEXT_QUESTION_TYPES = new Set<string | undefined>([QUESTION_TYPE.fileUpload, QUESTION_TYPE.rating]);

/**
 * Lista de solo lectura pregunta/respuesta del resumen del panel de workflow: layout de dos
 * columnas (pregunta 40% / valor) — distinto del genérico FormAnswersList (label arriba, valor
 * abajo), que sigue siendo el que usa asset-form-section-reader.tsx. Solo preguntas RESPONDIDAS
 * (hasAnswer + resolvedValueOf, mismo criterio que computeSectionStats — ver
 * workflow-section-stats.ts:17, necesario porque el backend inicializa value = default_value en
 * selects sin responder).
 */
export function WorkflowSummaryAnswers({ questions, emptyLabel }: WorkflowSummaryAnswersProps) {
  const answered = questions.filter((f) => hasAnswer(resolvedValueOf(f)));

  if (answered.length === 0) {
    return <p className="pl-[35px] text-[12.5px] text-[#94a3b8]">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-col gap-[8px] pl-[35px]">
      {answered.map((field) => {
        const clamp = !NON_TEXT_QUESTION_TYPES.has(field.question_type);
        return (
          <div key={field.id} className="flex items-baseline gap-[14px]">
            <p className="w-[40%] shrink-0 text-[12.5px] leading-[1.45] text-[#64748b]">{field.field_name}</p>
            <div className="min-w-0 flex-1">
              <FormFieldAnswerValue
                field={field}
                textClassName={cn(
                  "text-[13px] leading-[1.45] text-[#0f172a]",
                  clamp && "line-clamp-3",
                )}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
