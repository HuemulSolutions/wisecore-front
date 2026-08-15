import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulField } from "@/huemul/components/huemul-field";
import { HuemulCombobox } from "@/huemul/components/huemul-combobox";
import { Input } from "@/components/ui/input";
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
  QUESTION_TYPE,
  customFieldDataTypeLabel,
  jsonbToInputValue,
  readFieldConfig,
  readFieldOptions,
  writeFieldConfig,
  type FormFieldDraft,
} from "./question-type-meta";
import { QuestionTypePreview } from "./question-type-preview";
import { SectionFieldSeparator } from "./section-field-separator";

interface SectionQuestionTypeFieldsProps {
  field: FormFieldDraft;
  fetchCustomFieldOptions: (params: FetchOptionsParams) => Promise<FetchOptionsResult>;
  isPending?: boolean;
  onUpdate: (patch: Partial<SectionFormField>) => void;
  onCustomFieldChange: (customFieldId: string) => void;
  /** Ausente sin `custom_fields:c`: el botón de crear no se renderiza. */
  onCreateCustomField?: () => void;
}

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
  /** Ausente sin `custom_fields:c`: el botón de crear no se renderiza. */
  onCreateCustomField?: () => void;
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
        {onCreateCustomField && (
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
        )}
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
  const renderOptions = (variant: "radio" | "ordered" | "checkbox") => {
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
            ) : variant === "checkbox" ? (
              <span className="size-4 shrink-0 rounded border border-gray-300 bg-white" />
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
    case QUESTION_TYPE.paragraph:
    case QUESTION_TYPE.email:
    case QUESTION_TYPE.date:
    case QUESTION_TYPE.time:
      return <QuestionTypePreview questionType={qt} dataType={field.data_type} />;

    // ── Numéricos: min/max + preview ────────────────────────────────────────
    case QUESTION_TYPE.number:
    case QUESTION_TYPE.decimal: {
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
          <QuestionTypePreview questionType={qt} dataType={field.data_type} />
        </div>
      );
    }

    // ── Sí / No ─────────────────────────────────────────────────────────────
    case QUESTION_TYPE.yesNo:
      return <QuestionTypePreview questionType={qt} />;

    // ── Opción múltiple / desplegable ───────────────────────────────────────
    case QUESTION_TYPE.multipleChoice:
      return renderOptions("radio");

    case QUESTION_TYPE.dropdown:
      return renderOptions("ordered");

    case QUESTION_TYPE.dropdownMultiple:
      return renderOptions("checkbox");

    // ── Carga de archivos ───────────────────────────────────────────────────
    case QUESTION_TYPE.fileUpload: {
      const FILE_TYPE_OPTIONS = ["pdf", "docx", "xlsx", "png", "jpg", "csv", "pptx", "txt"];
      const allowedTypes = cfg.allowed_types ?? [];
      const toggleType = (type: string) => {
        const next = allowedTypes.includes(type)
          ? allowedTypes.filter((t) => t !== type)
          : [...allowedTypes, type];
        patchConfig({ allowed_types: next });
      };
      return (
        <div className="space-y-3">
          <QuestionTypePreview questionType={qt} />
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">{t("form.formFields.allowedTypes")}</p>
            <p className="text-xs text-muted-foreground">{t("form.formFields.allowedTypesHint")}</p>
            <div className="flex flex-wrap gap-2">
              {FILE_TYPE_OPTIONS.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  disabled={isPending}
                  className={`rounded px-2 py-0.5 text-xs border transition-colors ${
                    allowedTypes.includes(type)
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-muted text-muted-foreground hover:border-primary/40"
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
          <QuestionTypePreview
            questionType={qt}
            minValue={min}
            maxValue={max}
            minLabel={cfg.min_label}
            maxLabel={cfg.max_label}
          />
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
            options={[3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({ value: String(n), label: String(n) }))}
            selectSize="sm"
            disabled={isPending}
            className="max-w-[160px]"
          />
          <QuestionTypePreview questionType={qt} maxValue={stars} />
        </div>
      );
    }

    // ── Etiqueta: separador visual, sin configuración ───────────────────────
    case QUESTION_TYPE.label:
      return <SectionFieldSeparator name={field.field_name || t("form.formFields.statement")} />;

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
    default:
      return (
        <QuestionTypePreview
          questionType={qt}
          dataType={field.data_type}
          fieldName={field.field_name}
          required={field.required}
        />
      );
  }
}
