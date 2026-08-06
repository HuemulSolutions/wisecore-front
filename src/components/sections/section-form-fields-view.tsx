import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { SectionFormField } from "@/types/sections/core";
import {
  CUSTOM_FIELD_QUESTION_TYPE,
  QUESTION_TYPE,
  questionTypeIcon,
  questionTypeLabel,
  readFieldConfig,
  readFieldOptions,
} from "./question-type-meta";
import { SectionFieldSeparator } from "./section-field-separator";
import { PreviewBox, QuestionTypePreview } from "./question-type-preview";

interface SectionFormFieldsViewProps {
  fields: SectionFormField[];
}

// Vista de solo lectura de los campos de una sección tipo form (estilo formulario). El
// nombre + requerido + tipo ya se muestran en el header de cada tarjeta (más abajo), así
// que acá se delega en QuestionTypePreview solo por el control (sin fieldName).
export function SectionFormFieldsView({ fields }: SectionFormFieldsViewProps) {
  const { t } = useTranslation("sections");

  const sorted = [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const renderAnswer = (field: SectionFormField) => {
    const cfg = readFieldConfig(field);

    // Solo lectura: referencia a un custom field, sin control propio (ver
    // ia context/question-type-input-guide.md §3b).
    if (field.question_type === CUSTOM_FIELD_QUESTION_TYPE) {
      return (
        <PreviewBox>
          <Input disabled placeholder={t("form.formFields.customField")} className="h-9 bg-white" />
        </PreviewBox>
      );
    }

    return (
      <QuestionTypePreview
        questionType={field.question_type}
        dataType={field.data_type}
        options={readFieldOptions(field)}
        minValue={typeof field.min_value === "number" ? field.min_value : undefined}
        maxValue={typeof field.max_value === "number" ? field.max_value : undefined}
        minLabel={cfg.min_label}
        maxLabel={cfg.max_label}
      />
    );
  };

  return (
    <div className="space-y-3">
      {sorted.map((field, index) => {
        if (field.question_type === QUESTION_TYPE.label) {
          return <SectionFieldSeparator key={field.field_id || index} name={field.field_name} />;
        }
        const TypeIcon = questionTypeIcon(field.question_type);
        return (
          <div key={field.field_id || index} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <span className="text-sm font-medium text-gray-900">
                <span className="mr-1 text-gray-500">{index + 1}.</span>
                {field.field_name || field.field_id}
                {field.required && <span className="text-red-500"> *</span>}
              </span>
              <Badge variant="secondary" className="gap-1 shrink-0 font-normal">
                <TypeIcon className="size-3" />
                <span className="hidden sm:inline">{questionTypeLabel(field.question_type, t)}</span>
              </Badge>
            </div>
            {renderAnswer(field)}
          </div>
        );
      })}
    </div>
  );
}
