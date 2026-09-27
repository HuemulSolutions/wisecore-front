import { useTranslation } from "react-i18next";
import { SectionFieldSeparator } from "@/components/sections/section-field-separator";
import { FormFieldAnswerValue } from "@/components/sections/form-field-answer-value";
import { QUESTION_TYPE, isFieldVisible } from "@/components/sections/question-type-meta";
import { computeSectionStats, isSectionAnswerable } from "@/components/workflow/workflow-section-stats";
import type { ContentSection } from "@/types/assets";

export interface WorkflowSectionReadonlyFieldsProps {
  section: ContentSection;
}

/**
 * Campos de una sección en texto plano (sin permiso de edición o sección inactiva). Sin guardado,
 * validación ni upload: no duplica el runtime de AssetFormSection, que solo se monta cuando la
 * sección es editable. En sección inactiva muestra siempre «—».
 */
export function WorkflowSectionReadonlyFields({ section }: WorkflowSectionReadonlyFieldsProps) {
  const { t } = useTranslation("workflow");
  const { fields } = computeSectionStats(section);
  const isActive = isSectionAnswerable(section);
  const visibleFields = fields.filter(isFieldVisible);

  if (visibleFields.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("wizard.summary.noAnswers")}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {visibleFields.map((field, index) =>
        field.question_type === QUESTION_TYPE.label ? (
          <SectionFieldSeparator key={field.id || index} name={field.field_name} />
        ) : (
          <div key={field.id || index} className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-foreground">
              {field.field_name}
              {field.required && <span className="text-destructive"> *</span>}
            </p>
            <div className="rounded-md bg-muted/50 px-3 py-2 text-sm leading-normal">
              {isActive ? (
                <FormFieldAnswerValue field={field} textClassName="text-sm text-foreground" />
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
        ),
      )}
    </div>
  );
}
