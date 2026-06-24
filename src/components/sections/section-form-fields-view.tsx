import { useTranslation } from "react-i18next";
import { Mail, Star, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SectionFormField } from "@/types/sections/core";
import {
  CUSTOM_FIELD_QUESTION_TYPE,
  NUMERIC_DATA_TYPES,
  QUESTION_TYPE,
  questionTypeIcon,
  questionTypeLabel,
  readFieldConfig,
} from "./question-type-meta";

interface SectionFormFieldsViewProps {
  fields: SectionFormField[];
}

const PREVIEW_INPUT = "h-8 text-xs bg-white";

// Vista de solo lectura de los campos de una sección tipo form (estilo formulario).
export function SectionFormFieldsView({ fields }: SectionFormFieldsViewProps) {
  const { t } = useTranslation("sections");

  const sorted = [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const renderAnswer = (field: SectionFormField) => {
    const cfg = readFieldConfig(field);

    switch (field.question_type) {
      case QUESTION_TYPE.shortAnswer:
        return <Input disabled placeholder={t("form.formFields.previewShortAnswer")} className={PREVIEW_INPUT} />;

      case QUESTION_TYPE.paragraph:
        return <Textarea disabled placeholder={t("form.formFields.previewLongAnswer")} rows={3} className="text-xs bg-white resize-none" />;

      case QUESTION_TYPE.email:
        return (
          <div className="relative">
            <Input disabled type="email" placeholder={t("form.formFields.previewEmail")} className={`${PREVIEW_INPUT} pr-8`} />
            <Mail className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          </div>
        );

      case QUESTION_TYPE.date:
        return <Input disabled type="date" className={PREVIEW_INPUT} />;

      case QUESTION_TYPE.time:
        return <Input disabled type="time" className={PREVIEW_INPUT} />;

      case QUESTION_TYPE.number:
      case QUESTION_TYPE.decimal: {
        const isDecimal = field.question_type === QUESTION_TYPE.decimal || field.data_type === "decimal";
        const hasMin = typeof field.min_value === "number";
        const hasMax = typeof field.max_value === "number";
        return (
          <div className="space-y-1">
            <Input disabled type="number" placeholder={isDecimal ? "1.2" : "0"} className={PREVIEW_INPUT} />
            {(hasMin || hasMax) && (
              <p className="text-[11px] text-gray-400">
                {hasMin && `${t("form.formFields.minValue")}: ${field.min_value as number}`}
                {hasMin && hasMax && " · "}
                {hasMax && `${t("form.formFields.maxValue")}: ${field.max_value as number}`}
              </p>
            )}
          </div>
        );
      }

      case QUESTION_TYPE.yesNo:
        return (
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-200 bg-white px-3 text-xs text-gray-500">
              ✓ {t("form.formFields.previewYes")}
            </span>
            <span className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-200 bg-white px-3 text-xs text-gray-500">
              ✕ {t("form.formFields.previewNo")}
            </span>
          </div>
        );

      case QUESTION_TYPE.multipleChoice:
        return (
          <div className="space-y-2">
            {(cfg.options ?? []).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="size-4 shrink-0 rounded-full border border-gray-300 bg-white" />
                <span className="text-xs text-gray-700">{opt}</span>
              </div>
            ))}
          </div>
        );

      case QUESTION_TYPE.dropdown:
        return (
          <div className="space-y-2">
            {(cfg.options ?? []).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-4 shrink-0 text-xs text-gray-500">{i + 1}.</span>
                <span className="text-xs text-gray-700">{opt}</span>
              </div>
            ))}
          </div>
        );

      case QUESTION_TYPE.fileUpload:
        return (
          <div className="flex h-16 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-gray-300 bg-white text-xs text-gray-400">
            <Upload className="size-4" />
            {t("form.formFields.previewFileUpload")}
          </div>
        );

      case QUESTION_TYPE.linearScale: {
        const min = typeof field.min_value === "number" ? field.min_value : 1;
        const max = typeof field.max_value === "number" ? field.max_value : 5;
        const steps = max > min && max - min <= 20 ? Array.from({ length: max - min + 1 }, (_, i) => min + i) : [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {steps.map((n) => (
                <span key={n} className="flex size-7 items-center justify-center rounded-md border border-gray-200 bg-white text-xs text-gray-600">
                  {n}
                </span>
              ))}
            </div>
            {(cfg.startLabel || cfg.endLabel) && (
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>{cfg.startLabel}</span>
                <span>{cfg.endLabel}</span>
              </div>
            )}
          </div>
        );
      }

      case QUESTION_TYPE.rating: {
        const stars = cfg.stars ?? 5;
        return (
          <div className="flex flex-wrap items-center gap-1">
            {Array.from({ length: stars }, (_, i) => (
              <Star key={i} className="size-5 text-gray-300" />
            ))}
          </div>
        );
      }

      case CUSTOM_FIELD_QUESTION_TYPE:
        return <Input disabled placeholder={t("form.formFields.customField")} className={PREVIEW_INPUT} />;

      default: {
        if (NUMERIC_DATA_TYPES.includes(field.data_type as string)) {
          return <Input disabled type="number" placeholder={t("form.formFields.previewNumber")} className={PREVIEW_INPUT} />;
        }
        switch (field.data_type) {
          case "bool":
            return (
              <div className="flex items-center gap-2">
                <span className="size-4 shrink-0 rounded border border-gray-300 bg-white" />
                <span className="text-xs text-gray-400">{field.field_name}</span>
              </div>
            );
          case "date":
            return <Input disabled type="date" className={PREVIEW_INPUT} />;
          case "time":
            return <Input disabled type="time" className={PREVIEW_INPUT} />;
          case "image":
            return (
              <div className="flex h-16 items-center justify-center rounded-md border border-dashed border-gray-300 bg-white text-xs text-gray-400">
                {t("form.formFields.previewImage")}
              </div>
            );
          default:
            return <Input disabled placeholder={t("form.formFields.previewShortAnswer")} className={PREVIEW_INPUT} />;
        }
      }
    }
  };

  return (
    <div className="space-y-3">
      {sorted.map((field, index) => {
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
