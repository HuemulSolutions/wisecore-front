import { useTranslation } from "react-i18next";
import type { SectionFormField } from "@/types/sections/core";
import { readFieldConfig, readFieldOptions, type FormFieldDraft } from "./question-type-meta";
import { QuestionTypePreview } from "./question-type-preview";

interface SectionQuestionPreviewPanelProps {
  field: FormFieldDraft;
  availableDependencyFields: SectionFormField[];
}

// Columna derecha de la tarjeta de pregunta: reusa el mismo QuestionTypePreview que ya
// comparten el builder, la vista de solo lectura y el preview de custom fields (ver
// ia context/question-type-input-guide.md), agregándole solo el encabezado y el aviso de
// condición propios de esta pantalla — no se toca la firma de QuestionTypePreview.
export function SectionQuestionPreviewPanel({ field, availableDependencyFields }: SectionQuestionPreviewPanelProps) {
  const { t } = useTranslation("sections");
  const cfg = readFieldConfig(field);
  const condition = field.depends_on?.[0];
  const conditionTarget = condition
    ? availableDependencyFields.find((f) => f.field_id === condition.field_id)
    : undefined;

  return (
    <div
      className="flex flex-col gap-2.5 rounded-[10px] border p-3.5"
      style={{ borderColor: "#e2e8f0" }}
    >
      <span
        className="text-[11px] font-semibold uppercase"
        style={{ color: "#94a3b8", letterSpacing: "0.06em" }}
      >
        {t("form.formFields.builder.previewHeader")}
      </span>
      <QuestionTypePreview
        questionType={field.question_type}
        dataType={field.data_type}
        options={readFieldOptions(field)}
        minValue={typeof field.min_value === "number" ? field.min_value : undefined}
        maxValue={typeof field.max_value === "number" ? field.max_value : undefined}
        minLabel={cfg.min_label}
        maxLabel={cfg.max_label}
        fieldName={field.field_name || t("form.formFields.builder.untitledQuestion")}
        required={field.required}
      />
      {condition && conditionTarget && (
        <div
          className="rounded-md border px-2.5 py-2 text-xs"
          style={{ color: "#b45309", backgroundColor: "#fef6e7", borderColor: "#fbe3b4" }}
        >
          {t("form.formFields.builder.conditionalNotice", { name: conditionTarget.field_name })}
        </div>
      )}
    </div>
  );
}
