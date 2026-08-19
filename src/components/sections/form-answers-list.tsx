import { SectionFieldSeparator } from "@/components/sections/section-field-separator";
import { FormFieldAnswerValue } from "@/components/sections/form-field-answer-value";
import { QUESTION_TYPE, isFieldVisible } from "@/components/sections/question-type-meta";
import { cn } from "@/lib/utils";
import type { FormFieldValue } from "@/types/sections/core";

export interface FormAnswersListProps {
  /** Campos ya ordenados por `order` — usar computeSectionStats(section).fields. */
  fields: FormFieldValue[];
  /** Texto mostrado cuando no hay preguntas visibles. Lo traduce el caller (namespace propio). */
  emptyLabel: string;
  className?: string;
}

/**
 * Lista de solo lectura pregunta/respuesta de una sección form — compartida entre el resumen
 * de workflow (ver workflow-sections-summary.tsx) y el modo lector del asset (ver
 * asset-form-section-reader.tsx). No recibe `filePreview`: solo tiene sentido con subidas
 * de la sesión actual (ver asset-form-section.tsx), ausentes en toda vista puramente lectora.
 */
export function FormAnswersList({ fields, emptyLabel, className }: FormAnswersListProps) {
  const visibleFields = fields.filter(isFieldVisible);

  if (visibleFields.length === 0) {
    return <p className="py-6 text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {visibleFields.map((field, fieldIndex) =>
        field.question_type === QUESTION_TYPE.label ? (
          <SectionFieldSeparator key={field.id || fieldIndex} name={field.field_name} />
        ) : (
          <div key={field.id || fieldIndex} className="space-y-1 border-b pb-3 last:border-b-0 last:pb-0">
            <p className="text-xs text-muted-foreground">
              {field.field_name}
              {field.required && <span className="text-destructive"> *</span>}
            </p>
            <FormFieldAnswerValue field={field} />
          </div>
        ),
      )}
    </div>
  );
}
