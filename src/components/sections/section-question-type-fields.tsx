import { useTranslation } from "react-i18next";
import { Mail, Plus, Star, Upload, X } from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulField } from "@/huemul/components/huemul-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SectionFormField } from "@/types/sections/core";
import type { CustomFieldOption } from "./section-form-field-card";
import {
  CUSTOM_FIELD_QUESTION_TYPE,
  NUMERIC_DATA_TYPES,
  QUESTION_TYPE,
  jsonbToInputValue,
  readFieldConfig,
  writeFieldConfig,
  type FormFieldDraft,
} from "./question-type-meta";

interface SectionQuestionTypeFieldsProps {
  field: FormFieldDraft;
  customFieldOptions: CustomFieldOption[];
  isPending?: boolean;
  onUpdate: (patch: Partial<SectionFormField>) => void;
  onCustomFieldChange: (customFieldId: string) => void;
}

// Caja gris de vista previa (mismo estilo que el resto del builder).
function PreviewBox({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md bg-gray-50 p-3">{children}</div>;
}

const PREVIEW_INPUT = "h-8 text-xs bg-white";

export function SectionQuestionTypeFields({
  field,
  customFieldOptions,
  isPending,
  onUpdate,
  onCustomFieldChange,
}: SectionQuestionTypeFieldsProps) {
  const { t } = useTranslation("sections");
  const cfg = readFieldConfig(field);
  const qt = field.question_type;

  const patchConfig = (patch: Parameters<typeof writeFieldConfig>[1]) =>
    onUpdate({ default_value: writeFieldConfig(field, patch) });

  // ── Editor de opciones (opcion_multiple / desplegable) ────────────────────
  const renderOptions = (variant: "radio" | "ordered") => {
    const options = cfg.options ?? [];
    const setOptions = (next: string[]) => patchConfig({ options: next });
    return (
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            {variant === "radio" ? (
              <span className="size-4 shrink-0 rounded-full border border-gray-300 bg-white" />
            ) : (
              <span className="w-4 shrink-0 text-xs text-gray-500">{i + 1}.</span>
            )}
            <Input
              value={opt}
              onChange={(e) =>
                setOptions(options.map((o, idx) => (idx === i ? e.target.value : o)))
              }
              placeholder={t("form.formFields.option", { n: i + 1 })}
              className="h-8 text-xs bg-white"
              disabled={isPending}
            />
            <HuemulButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
              disabled={isPending}
              icon={X}
              tooltip={t("form.formFields.removeOption")}
              className="h-7 w-7 shrink-0 text-gray-400 hover:text-gray-700"
            />
          </div>
        ))}
        <HuemulButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOptions([...options, t("form.formFields.option", { n: options.length + 1 })])}
          disabled={isPending}
          icon={Plus}
          className="h-7 px-1 text-xs text-gray-600 hover:text-gray-900"
        >
          {t("form.formFields.addOption")}
        </HuemulButton>
      </div>
    );
  };

  switch (qt) {
    // ── Texto / email / fecha / hora: solo preview ──────────────────────────
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

    // ── Numéricos: min/max + preview ────────────────────────────────────────
    case QUESTION_TYPE.number:
    case QUESTION_TYPE.decimal: {
      const isDecimal = qt === QUESTION_TYPE.decimal || field.data_type === "decimal";
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <HuemulField
              type="number"
              label={t("form.formFields.minValue")}
              value={jsonbToInputValue(field.min_value)}
              onChange={(v) => onUpdate({ min_value: v === "" ? null : v })}
              placeholder={t("form.formFields.noLimit")}
              disabled={isPending}
            />
            <HuemulField
              type="number"
              label={t("form.formFields.maxValue")}
              value={jsonbToInputValue(field.max_value)}
              onChange={(v) => onUpdate({ max_value: v === "" ? null : v })}
              placeholder={t("form.formFields.noLimit")}
              disabled={isPending}
            />
          </div>
          <PreviewBox>
            <Input disabled type="number" placeholder={isDecimal ? "1.2" : "0"} className={PREVIEW_INPUT} />
          </PreviewBox>
        </div>
      );
    }

    // ── Sí / No ─────────────────────────────────────────────────────────────
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

    // ── Opción múltiple / desplegable ───────────────────────────────────────
    case QUESTION_TYPE.multipleChoice:
      return renderOptions("radio");

    case QUESTION_TYPE.dropdown:
      return renderOptions("ordered");

    // ── Carga de archivos ───────────────────────────────────────────────────
    case QUESTION_TYPE.fileUpload:
      return (
        <div className="space-y-3">
          <PreviewBox>
            <div className="flex h-16 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-gray-300 bg-white text-xs text-gray-400">
              <Upload className="size-4" />
              {t("form.formFields.previewFileUpload")}
            </div>
          </PreviewBox>
          <div className="grid grid-cols-2 gap-3">
            <HuemulField
              type="select"
              label={t("form.formFields.maxFiles")}
              value={String(cfg.maxFiles ?? 1)}
              onChange={(v) => patchConfig({ maxFiles: Number(v) })}
              options={[1, 2, 3, 5, 10].map((n) => ({ value: String(n), label: String(n) }))}
              selectSize="sm"
              disabled={isPending}
            />
            <HuemulField
              type="select"
              label={t("form.formFields.maxSize")}
              value={String(cfg.maxSize ?? 10)}
              onChange={(v) => patchConfig({ maxSize: Number(v) })}
              options={[1, 5, 10, 25, 50].map((n) => ({ value: String(n), label: `${n} MB` }))}
              selectSize="sm"
              disabled={isPending}
            />
          </div>
        </div>
      );

    // ── Escala lineal ───────────────────────────────────────────────────────
    case QUESTION_TYPE.linearScale: {
      const min = typeof field.min_value === "number" ? field.min_value : 1;
      const max = typeof field.max_value === "number" ? field.max_value : 5;
      const steps = max > min && max - min <= 20 ? Array.from({ length: max - min + 1 }, (_, i) => min + i) : [];
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Select value={String(min)} onValueChange={(v) => onUpdate({ min_value: Number(v) })} disabled={isPending}>
              <SelectTrigger size="sm" className="w-16 bg-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-gray-500">{t("form.formFields.scaleTo")}</span>
            <Select value={String(max)} onValueChange={(v) => onUpdate({ max_value: Number(v) })} disabled={isPending}>
              <SelectTrigger size="sm" className="w-16 bg-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <HuemulField
              type="text"
              label={t("form.formFields.startLabel")}
              value={cfg.startLabel ?? ""}
              onChange={(v) => patchConfig({ startLabel: v as string })}
              placeholder={t("form.formFields.startLabelPlaceholder")}
              disabled={isPending}
            />
            <HuemulField
              type="text"
              label={t("form.formFields.endLabel")}
              value={cfg.endLabel ?? ""}
              onChange={(v) => patchConfig({ endLabel: v as string })}
              placeholder={t("form.formFields.endLabelPlaceholder")}
              disabled={isPending}
            />
          </div>
          {steps.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {steps.map((n) => (
                <span key={n} className="flex size-7 items-center justify-center rounded-md border border-gray-200 bg-white text-xs text-gray-600">
                  {n}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    // ── Calificación ────────────────────────────────────────────────────────
    case QUESTION_TYPE.rating: {
      const stars = cfg.stars ?? 5;
      return (
        <div className="space-y-3">
          <HuemulField
            type="select"
            label={t("form.formFields.starCount")}
            value={String(stars)}
            onChange={(v) => patchConfig({ stars: Number(v) })}
            options={[3, 4, 5, 10].map((n) => ({ value: String(n), label: String(n) }))}
            selectSize="sm"
            disabled={isPending}
            className="max-w-[160px]"
          />
          <div className="flex flex-wrap items-center gap-1">
            {Array.from({ length: stars }, (_, i) => (
              <Star key={i} className="size-5 text-gray-300" />
            ))}
          </div>
        </div>
      );
    }

    // ── Campo personalizado ─────────────────────────────────────────────────
    case CUSTOM_FIELD_QUESTION_TYPE:
      return (
        <div className="space-y-1">
          <HuemulField
            type="select"
            label={t("form.formFields.customField")}
            required
            value={field.custom_field_id ?? ""}
            onChange={(val) => onCustomFieldChange(val as string)}
            options={customFieldOptions.map((cf) => ({ value: cf.id, label: cf.name }))}
            placeholder={
              customFieldOptions.length === 0
                ? t("form.formFields.customFieldEmpty")
                : t("form.formFields.customFieldPlaceholder")
            }
            disabled={isPending || customFieldOptions.length === 0}
            error={!field.custom_field_id ? t("form.validation.customFieldRequired") : undefined}
          />
          <p className="text-xs text-gray-500">{t("form.formFields.customFieldHint")}</p>
        </div>
      );

    // ── Fallback: preview genérico por data_type (slug no contemplado) ───────
    default: {
      if (NUMERIC_DATA_TYPES.includes(field.data_type as string)) {
        return (
          <PreviewBox>
            <Input disabled type="number" placeholder={t("form.formFields.previewNumber")} className={PREVIEW_INPUT} />
          </PreviewBox>
        );
      }
      switch (field.data_type) {
        case "bool":
          return (
            <PreviewBox>
              <div className="flex items-center gap-2">
                <span className="size-4 shrink-0 rounded border border-gray-300 bg-white" />
                <span className="text-xs text-gray-400">{field.field_name || t("form.formFields.fieldName")}</span>
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
