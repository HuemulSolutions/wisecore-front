import { useTranslation } from "react-i18next";
import { Mail, Star, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NUMERIC_DATA_TYPES, QUESTION_TYPE } from "./question-type-meta";

// Caja gris de vista previa (mismo estilo compartido entre sections y custom fields).
export function PreviewBox({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md bg-gray-50 p-3">{children}</div>;
}

export const PREVIEW_INPUT = "h-8 text-xs bg-white";

interface QuestionTypePreviewOption {
  id: string;
  label: string;
}

interface QuestionTypePreviewProps {
  questionType: string;
  dataType?: string | null;
  options?: QuestionTypePreviewOption[];
  minValue?: number | null;
  maxValue?: number | null;
  fieldName?: string;
}

// Vista previa visual por question type, compartida entre el builder de secciones (form fields)
// y custom fields, para que ambas features se vean exactamente igual. Solo renderiza el
// preview no-interactivo; la configuracion editable (opciones, min/max, etc.) vive en cada
// consumidor (section-question-type-fields.tsx / custom-fields-form-fields.tsx).
export function QuestionTypePreview({
  questionType,
  dataType,
  options = [],
  minValue,
  maxValue,
  fieldName,
}: QuestionTypePreviewProps) {
  const { t } = useTranslation("sections");

  switch (questionType) {
    case QUESTION_TYPE.shortAnswer:
      return (
        <PreviewBox>
          <Input disabled placeholder={t("form.formFields.previewShortAnswer")} className={PREVIEW_INPUT} />
        </PreviewBox>
      );

    case QUESTION_TYPE.paragraph:
      return (
        <PreviewBox>
          <Textarea disabled placeholder={t("form.formFields.previewParagraph")} rows={3} className="text-xs bg-white resize-none" />
        </PreviewBox>
      );

    case QUESTION_TYPE.email:
      return (
        <PreviewBox>
          <div className="relative">
            <Input disabled type="email" placeholder={t("form.formFields.previewEmail")} className={`${PREVIEW_INPUT} pr-8`} />
            <Mail className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          </div>
        </PreviewBox>
      );

    case QUESTION_TYPE.date:
      return (
        <PreviewBox>
          <Input disabled type="date" className={PREVIEW_INPUT} />
        </PreviewBox>
      );

    case QUESTION_TYPE.time:
      return (
        <PreviewBox>
          <Input disabled type="time" className={PREVIEW_INPUT} />
        </PreviewBox>
      );

    case QUESTION_TYPE.number:
    case QUESTION_TYPE.decimal: {
      const isDecimal = questionType === QUESTION_TYPE.decimal || dataType === "decimal";
      return (
        <PreviewBox>
          <Input disabled type="number" placeholder={isDecimal ? "1.2" : "0"} className={PREVIEW_INPUT} />
        </PreviewBox>
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
    case QUESTION_TYPE.dropdown:
    case QUESTION_TYPE.dropdownMultiple: {
      const variant =
        questionType === QUESTION_TYPE.multipleChoice
          ? "radio"
          : questionType === QUESTION_TYPE.dropdownMultiple
            ? "checkbox"
            : "ordered";
      return (
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={opt.id || i} className="flex items-center gap-2">
              {variant === "radio" ? (
                <span className="size-4 shrink-0 rounded-full border border-gray-300 bg-white" />
              ) : variant === "checkbox" ? (
                <span className="size-4 shrink-0 rounded border border-gray-300 bg-white" />
              ) : (
                <span className="w-4 shrink-0 text-xs text-gray-500">{i + 1}.</span>
              )}
              <span className="text-xs text-gray-600">{opt.label}</span>
            </div>
          ))}
        </div>
      );
    }

    case QUESTION_TYPE.fileUpload:
      return (
        <PreviewBox>
          <div className="flex h-16 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-gray-300 bg-white text-xs text-gray-400">
            <Upload className="size-4" />
            {t("form.formFields.previewFileUpload")}
          </div>
        </PreviewBox>
      );

    case QUESTION_TYPE.linearScale: {
      const min = typeof minValue === "number" ? minValue : 1;
      const max = typeof maxValue === "number" ? maxValue : 5;
      const steps = max > min && max - min <= 20 ? Array.from({ length: max - min + 1 }, (_, i) => min + i) : [];
      if (steps.length === 0) return null;
      return (
        <div className="flex flex-wrap items-center gap-2">
          {steps.map((n) => (
            <span key={n} className="flex size-7 items-center justify-center rounded-md border border-gray-200 bg-white text-xs text-gray-600">
              {n}
            </span>
          ))}
        </div>
      );
    }

    case QUESTION_TYPE.rating: {
      const stars = typeof maxValue === "number" ? maxValue : 5;
      return (
        <div className="flex flex-wrap items-center gap-1">
          {Array.from({ length: stars }, (_, i) => (
            <Star key={i} className="size-5 text-gray-300" />
          ))}
        </div>
      );
    }

    case QUESTION_TYPE.customField:
      return null;

    default: {
      if (NUMERIC_DATA_TYPES.includes(dataType as string)) {
        return (
          <PreviewBox>
            <Input disabled type="number" placeholder={t("form.formFields.previewNumber")} className={PREVIEW_INPUT} />
          </PreviewBox>
        );
      }
      switch (dataType) {
        case "bool":
          return (
            <PreviewBox>
              <div className="flex items-center gap-2">
                <span className="size-4 shrink-0 rounded border border-gray-300 bg-white" />
                <span className="text-xs text-gray-400">{fieldName || t("form.formFields.fieldName")}</span>
              </div>
            </PreviewBox>
          );
        case "date":
          return (
            <PreviewBox>
              <Input disabled type="date" className={PREVIEW_INPUT} />
            </PreviewBox>
          );
        case "time":
          return (
            <PreviewBox>
              <Input disabled type="time" className={PREVIEW_INPUT} />
            </PreviewBox>
          );
        case "image":
          return (
            <PreviewBox>
              <div className="flex h-16 items-center justify-center rounded-md border border-dashed border-gray-300 bg-white text-xs text-gray-400">
                {t("form.formFields.previewImage")}
              </div>
            </PreviewBox>
          );
        default:
          return (
            <PreviewBox>
              <Input disabled placeholder={t("form.formFields.previewShortAnswer")} className={PREVIEW_INPUT} />
            </PreviewBox>
          );
      }
    }
  }
}
