import { useTranslation } from "react-i18next";
import { Mail, Plus, Star, Upload, X } from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulField } from "@/huemul/components/huemul-field";
import { HuemulCombobox } from "@/huemul/components/huemul-combobox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCustomField } from "@/hooks/useCustomFields";
import type { FormFieldOption, SectionFormField } from "@/types/sections/core";
import type { FetchOptionsParams, FetchOptionsResult } from "@/types/huemul/field";
import {
  CUSTOM_FIELD_QUESTION_TYPE,
  NUMERIC_DATA_TYPES,
  QUESTION_TYPE,
  customFieldDataTypeLabel,
  jsonbToInputValue,
  readFieldConfig,
  readFieldOptions,
  writeFieldConfig,
  type FormFieldDraft,
} from "./question-type-meta";

interface SectionQuestionTypeFieldsProps {
  field: FormFieldDraft;
  fetchCustomFieldOptions: (params: FetchOptionsParams) => Promise<FetchOptionsResult>;
  isPending?: boolean;
  onUpdate: (patch: Partial<SectionFormField>) => void;
  onCustomFieldChange: (customFieldId: string) => void;
  onCreateCustomField: () => void;
}

// Caja gris de vista previa (mismo estilo que el resto del builder).
function PreviewBox({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md bg-gray-50 p-3">{children}</div>;
}

const PREVIEW_INPUT = "h-8 text-xs bg-white";

// Selector de campo personalizado: combobox async sobre el catálogo de la organización
// + botón para crear uno nuevo sin salir del formulario. Aislado en su propio componente
// porque `useCustomField` sólo debe ejecutarse cuando este question type está activo, y
// los hooks no pueden llamarse condicionalmente dentro del switch del componente padre.
function SectionCustomFieldQuestionEditor({
  field,
  fetchCustomFieldOptions,
  isPending,
  onCustomFieldChange,
  onCreateCustomField,
}: {
  field: FormFieldDraft;
  fetchCustomFieldOptions: (params: FetchOptionsParams) => Promise<FetchOptionsResult>;
  isPending?: boolean;
  onCustomFieldChange: (customFieldId: string) => void;
  onCreateCustomField: () => void;
}) {
  const { t } = useTranslation(["sections", "custom-fields"]);
  const { data: selectedCustomField } = useCustomField(
    field.custom_field_id ?? "",
    !!field.custom_field_id,
  );
  const selectedOptions = selectedCustomField
    ? [{
        value: selectedCustomField.id,
        label: selectedCustomField.name,
        description: customFieldDataTypeLabel(selectedCustomField.data_type, t),
      }]
    : [];

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">
        {t("form.formFields.customField")} <span className="text-red-500">*</span>
      </label>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <HuemulCombobox
            value={field.custom_field_id ?? ""}
            onValueChange={(v) => onCustomFieldChange(v as string)}
            fetchOptions={fetchCustomFieldOptions}
            pageSize={20}
            selectedOptions={selectedOptions}
            placeholder={t("form.formFields.customFieldPlaceholder")}
            emptyMessage={t("form.formFields.customFieldEmpty")}
            disabled={isPending}
            error={!field.custom_field_id}
          />
        </div>
        <HuemulButton
          type="button"
          variant="outline"
          size="sm"
          onClick={onCreateCustomField}
          disabled={isPending}
          icon={Plus}
          className="h-8 shrink-0 text-xs"
        >
          {t("form.formFields.createCustomField")}
        </HuemulButton>
      </div>
      {!field.custom_field_id && (
        <p className="text-xs text-red-500">{t("form.validation.customFieldRequired")}</p>
      )}
      <p className="text-xs text-gray-500">{t("form.formFields.customFieldHint")}</p>
    </div>
  );
}

export function SectionQuestionTypeFields({
  field,
  fetchCustomFieldOptions,
  isPending,
  onUpdate,
  onCustomFieldChange,
  onCreateCustomField,
}: SectionQuestionTypeFieldsProps) {
  const { t } = useTranslation("sections");
  const cfg = readFieldConfig(field);
  const qt = field.question_type;

  const patchConfig = (patch: Parameters<typeof writeFieldConfig>[1]) =>
    onUpdate({ default_value: writeFieldConfig(field, patch) });

  // ── Editor de opciones (opcion_multiple / desplegable) ────────────────────
  // default_value es directamente FormFieldOption[] (array, no objeto envuelto).
  const renderOptions = (variant: "radio" | "ordered") => {
    const options = readFieldOptions(field);
    const setOptions = (next: FormFieldOption[]) => onUpdate({ default_value: next });
    const slugify = (label: string) =>
      label.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || String(Date.now());
    return (
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={opt.id || i} className="flex items-center gap-2">
            {variant === "radio" ? (
              <span className="size-4 shrink-0 rounded-full border border-gray-300 bg-white" />
            ) : (
              <span className="w-4 shrink-0 text-xs text-gray-500">{i + 1}.</span>
            )}
            <Input
              value={opt.label}
              onChange={(e) => {
                const newLabel = e.target.value;
                setOptions(options.map((o, idx) => idx === i ? { ...o, label: newLabel } : o));
              }}
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
          onClick={() => {
            const label = t("form.formFields.option", { n: options.length + 1 });
            setOptions([...options, { id: slugify(label), label }]);
          }}
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
    case QUESTION_TYPE.fileUpload: {
      const FILE_TYPE_OPTIONS = ["pdf", "docx", "xlsx", "png", "jpg", "csv"];
      const allowedTypes = cfg.allowed_types ?? [];
      const toggleType = (type: string) => {
        const next = allowedTypes.includes(type)
          ? allowedTypes.filter((t) => t !== type)
          : [...allowedTypes, type];
        patchConfig({ allowed_types: next });
      };
      return (
        <div className="space-y-3">
          <PreviewBox>
            <div className="flex h-16 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-gray-300 bg-white text-xs text-gray-400">
              <Upload className="size-4" />
              {t("form.formFields.previewFileUpload")}
            </div>
          </PreviewBox>
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">{t("form.formFields.allowedTypes")}</p>
            <div className="flex flex-wrap gap-2">
              {FILE_TYPE_OPTIONS.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  disabled={isPending}
                  className={`rounded px-2 py-0.5 text-xs border transition-colors ${
                    allowedTypes.includes(type)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <HuemulField
            type="select"
            label={t("form.formFields.maxSize")}
            value={String(cfg.max_size_mb ?? 10)}
            onChange={(v) => patchConfig({ max_size_mb: Number(v) })}
            options={[1, 5, 10, 25, 50].map((n) => ({ value: String(n), label: `${n} MB` }))}
            selectSize="sm"
            disabled={isPending}
            className="max-w-[160px]"
          />
        </div>
      );
    }

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
              value={cfg.min_label ?? ""}
              onChange={(v) => patchConfig({ min_label: v as string })}
              placeholder={t("form.formFields.startLabelPlaceholder")}
              disabled={isPending}
            />
            <HuemulField
              type="text"
              label={t("form.formFields.endLabel")}
              value={cfg.max_label ?? ""}
              onChange={(v) => patchConfig({ max_label: v as string })}
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
    // El número de estrellas va en max_value (requerido por el backend).
    case QUESTION_TYPE.rating: {
      const stars = typeof field.max_value === "number" ? field.max_value : 5;
      return (
        <div className="space-y-3">
          <HuemulField
            type="select"
            label={t("form.formFields.starCount")}
            value={String(stars)}
            onChange={(v) => onUpdate({ max_value: Number(v) })}
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
        <SectionCustomFieldQuestionEditor
          field={field}
          fetchCustomFieldOptions={fetchCustomFieldOptions}
          isPending={isPending}
          onCustomFieldChange={onCustomFieldChange}
          onCreateCustomField={onCreateCustomField}
        />
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
