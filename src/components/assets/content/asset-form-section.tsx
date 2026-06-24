import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Star, Upload } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { HuemulButton } from "@/huemul/components/huemul-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { handleApiError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";
import { updateSectionFormValues } from "@/services/section_execution";
import type { FormFieldValue } from "@/types/sections/core";
import {
  CUSTOM_FIELD_QUESTION_TYPE,
  NUMERIC_DATA_TYPES,
  QUESTION_TYPE,
  questionTypeLabel,
  readFieldConfig,
} from "@/components/sections/question-type-meta";

interface AssetFormSectionProps {
  /** id del section_execution → se usa en el PATCH /form_values */
  sectionExecutionId: string;
  formFields: FormFieldValue[];
  status?: string;
  organizationId?: string;
  /** Si el usuario puede responder/editar el formulario (modo editor + permiso). Si es false, solo lectura. */
  canInteract: boolean;
  responderName?: string;
  respondedAt?: string;
  /** Refresca el contenido del asset tras guardar */
  onUpdate?: () => void;
}

type AnswerMap = Record<string, unknown>;

const FIELD_INPUT = "h-9 text-sm bg-white";

// Inicializa el mapa de respuestas desde los valores actuales del snapshot.
function buildInitialAnswers(fields: FormFieldValue[]): AnswerMap {
  const map: AnswerMap = {};
  for (const f of fields) map[f.id] = f.value ?? null;
  return map;
}

// ¿El campo tiene una respuesta no vacía?
function hasAnswer(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function AssetFormSection({
  sectionExecutionId,
  formFields,
  status,
  organizationId,
  canInteract,
  responderName,
  respondedAt,
  onUpdate,
}: AssetFormSectionProps) {
  const { t } = useTranslation("sections");

  const sortedFields = useMemo(
    () => [...formFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [formFields],
  );

  const isAnswered = !!status && status !== "pending";
  const [mode, setMode] = useState<"edit" | "view">(
    canInteract && !isAnswered ? "edit" : "view",
  );
  const [answers, setAnswers] = useState<AnswerMap>(() => buildInitialAnswers(sortedFields));
  const [isSaving, setIsSaving] = useState(false);

  const setAnswer = (fieldId: string, value: unknown) =>
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));

  const handleSubmit = async () => {
    // Validación de requeridos
    const missingRequired = sortedFields.some((f) => f.required && !hasAnswer(answers[f.id]));
    if (missingRequired) {
      toast.error(t("form.fill.requiredError"));
      return;
    }

    setIsSaving(true);
    try {
      const values = sortedFields.map((f) => ({ id: f.id, value: answers[f.id] ?? null }));
      await updateSectionFormValues(sectionExecutionId, values, organizationId);
      toast.success(t("form.fill.saved"));
      setMode("view");
      onUpdate?.();
    } catch (error) {
      handleApiError(error, { fallbackMessage: t("form.fill.saveError") });
    } finally {
      setIsSaving(false);
    }
  };

  if (sortedFields.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
        {t("form.fill.emptyForm")}
      </div>
    );
  }

  const editing = mode === "edit" && canInteract;

  // ── Render de un input editable según el tipo de pregunta ──────────────────
  const renderInput = (field: FormFieldValue) => {
    const cfg = readFieldConfig(field);
    const value = answers[field.id];

    switch (field.question_type) {
      case QUESTION_TYPE.shortAnswer:
        return (
          <Input
            className={FIELD_INPUT}
            value={(value as string) ?? ""}
            placeholder={t("form.formFields.previewShortAnswer")}
            onChange={(e) => setAnswer(field.id, e.target.value)}
          />
        );

      case QUESTION_TYPE.paragraph:
        return (
          <Textarea
            className="text-sm bg-white resize-none"
            rows={3}
            value={(value as string) ?? ""}
            placeholder={t("form.formFields.previewLongAnswer")}
            onChange={(e) => setAnswer(field.id, e.target.value)}
          />
        );

      case QUESTION_TYPE.email:
        return (
          <div className="relative">
            <Input
              type="email"
              className={`${FIELD_INPUT} pr-9`}
              value={(value as string) ?? ""}
              placeholder={t("form.formFields.previewEmail")}
              onChange={(e) => setAnswer(field.id, e.target.value)}
            />
            <Mail className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          </div>
        );

      case QUESTION_TYPE.number:
      case QUESTION_TYPE.decimal: {
        const isDecimal = field.question_type === QUESTION_TYPE.decimal || field.data_type === "decimal";
        return (
          <Input
            type="number"
            step={isDecimal ? "any" : "1"}
            className={FIELD_INPUT}
            value={value === null || value === undefined ? "" : (value as number)}
            min={typeof field.min_value === "number" ? field.min_value : undefined}
            max={typeof field.max_value === "number" ? field.max_value : undefined}
            placeholder={isDecimal ? "1.2" : "0"}
            onChange={(e) => {
              const raw = e.target.value;
              setAnswer(field.id, raw === "" ? null : Number(raw));
            }}
          />
        );
      }

      case QUESTION_TYPE.yesNo:
        return (
          <div className="flex items-center gap-2">
            {[true, false].map((opt) => {
              const selected = value === opt;
              return (
                <button
                  key={String(opt)}
                  type="button"
                  onClick={() => setAnswer(field.id, opt)}
                  className={cn(
                    "inline-flex h-9 items-center gap-1 rounded-md border px-4 text-sm transition-colors",
                    selected
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                  )}
                >
                  {opt ? t("form.formFields.previewYes") : t("form.formFields.previewNo")}
                </button>
              );
            })}
          </div>
        );

      case QUESTION_TYPE.multipleChoice:
        return (
          <RadioGroup
            value={(value as string) ?? ""}
            onValueChange={(v) => setAnswer(field.id, v)}
            className="space-y-2"
          >
            {(cfg.options ?? []).map((opt, i) => (
              <label key={i} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <RadioGroupItem value={opt} id={`${field.id}-${i}`} />
                {opt}
              </label>
            ))}
          </RadioGroup>
        );

      case QUESTION_TYPE.dropdown:
        return (
          <Select value={(value as string) ?? ""} onValueChange={(v) => setAnswer(field.id, v)}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder={t("form.fill.selectOption")} />
            </SelectTrigger>
            <SelectContent>
              {(cfg.options ?? []).map((opt, i) => (
                <SelectItem key={i} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case QUESTION_TYPE.linearScale: {
        const min = typeof field.min_value === "number" ? field.min_value : 1;
        const max = typeof field.max_value === "number" ? field.max_value : 5;
        const steps =
          max > min && max - min <= 20 ? Array.from({ length: max - min + 1 }, (_, i) => min + i) : [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {steps.map((n) => {
                const selected = value === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAnswer(field.id, n)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-md border text-sm transition-colors",
                      selected
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            {(cfg.startLabel || cfg.endLabel) && (
              <div className="flex justify-between text-xs text-gray-400">
                <span>{cfg.startLabel}</span>
                <span>{cfg.endLabel}</span>
              </div>
            )}
          </div>
        );
      }

      case QUESTION_TYPE.rating: {
        const stars = cfg.stars ?? 5;
        const current = typeof value === "number" ? value : 0;
        return (
          <div className="flex flex-wrap items-center gap-1">
            {Array.from({ length: stars }, (_, i) => {
              const n = i + 1;
              return (
                <button key={i} type="button" onClick={() => setAnswer(field.id, n)} className="p-0.5">
                  <Star
                    className={cn(
                      "size-6 transition-colors",
                      n <= current ? "fill-amber-400 text-amber-400" : "text-gray-300",
                    )}
                  />
                </button>
              );
            })}
          </div>
        );
      }

      case QUESTION_TYPE.date:
        return (
          <Input
            type="date"
            className={FIELD_INPUT}
            value={(value as string) ?? ""}
            onChange={(e) => setAnswer(field.id, e.target.value)}
          />
        );

      case QUESTION_TYPE.time:
        return (
          <Input
            type="time"
            className={FIELD_INPUT}
            value={(value as string) ?? ""}
            onChange={(e) => setAnswer(field.id, e.target.value)}
          />
        );

      case QUESTION_TYPE.fileUpload:
        // Fuera de alcance por ahora: placeholder no interactivo.
        return (
          <div className="flex h-16 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-gray-300 bg-white text-xs text-gray-400">
            <Upload className="size-4" />
            {t("form.formFields.previewFileUpload")}
          </div>
        );

      case CUSTOM_FIELD_QUESTION_TYPE:
      default: {
        // Fallback por data_type
        if (NUMERIC_DATA_TYPES.includes(field.data_type as string)) {
          return (
            <Input
              type="number"
              className={FIELD_INPUT}
              value={value === null || value === undefined ? "" : (value as number)}
              onChange={(e) => setAnswer(field.id, e.target.value === "" ? null : Number(e.target.value))}
            />
          );
        }
        if (field.data_type === "date") {
          return (
            <Input
              type="date"
              className={FIELD_INPUT}
              value={(value as string) ?? ""}
              onChange={(e) => setAnswer(field.id, e.target.value)}
            />
          );
        }
        if (field.data_type === "time") {
          return (
            <Input
              type="time"
              className={FIELD_INPUT}
              value={(value as string) ?? ""}
              onChange={(e) => setAnswer(field.id, e.target.value)}
            />
          );
        }
        return (
          <Input
            className={FIELD_INPUT}
            value={(value as string) ?? ""}
            onChange={(e) => setAnswer(field.id, e.target.value)}
          />
        );
      }
    }
  };

  // ── Render del valor en solo lectura ───────────────────────────────────────
  const renderReadOnly = (field: FormFieldValue) => {
    const cfg = readFieldConfig(field);
    const value = field.value;

    if (!hasAnswer(value)) {
      return <span className="text-sm italic text-gray-400">{t("form.fill.noAnswer")}</span>;
    }

    if (field.question_type === QUESTION_TYPE.yesNo) {
      return (
        <span className="text-sm text-gray-800">
          {value ? t("form.formFields.previewYes") : t("form.formFields.previewNo")}
        </span>
      );
    }

    if (field.question_type === QUESTION_TYPE.rating) {
      const stars = cfg.stars ?? 5;
      const current = typeof value === "number" ? value : 0;
      return (
        <div className="flex items-center gap-1">
          {Array.from({ length: stars }, (_, i) => (
            <Star
              key={i}
              className={cn("size-5", i < current ? "fill-amber-400 text-amber-400" : "text-gray-300")}
            />
          ))}
        </div>
      );
    }

    if (field.question_type === QUESTION_TYPE.paragraph) {
      return <p className="whitespace-pre-wrap text-sm text-gray-800">{String(value)}</p>;
    }

    return <span className="text-sm text-gray-800">{String(value)}</span>;
  };

  return (
    <div className="w-full">
      <div className="space-y-5">
        {sortedFields.map((field, index) => {
          const typeHint = questionTypeLabel(field.question_type ?? "", t);
          return (
            <div key={field.id || index} className="space-y-2">
              <label className="flex items-baseline gap-1.5 text-sm font-semibold text-gray-900">
                <span>
                  {field.field_name}
                  {field.required && <span className="text-red-500"> *</span>}
                </span>
                {typeHint && <span className="text-xs font-normal text-gray-400">· {typeHint}</span>}
              </label>
              {editing ? renderInput(field) : renderReadOnly(field)}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {(canInteract || responderName) && (
        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3">
          {editing ? (
            <>
              <span className="text-xs text-gray-400">{t("form.fill.requiredFieldsNote")}</span>
              <HuemulButton
                variant="default"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                loading={isSaving}
                label={t("form.fill.submitResponses")}
                onClick={handleSubmit}
              />
            </>
          ) : (
            <>
              <span className="text-xs text-gray-400">
                {responderName
                  ? respondedAt
                    ? t("form.fill.respondedBy", {
                        name: responderName,
                        date: new Date(respondedAt).toLocaleString(),
                      })
                    : responderName
                  : null}
              </span>
              {canInteract && (
                <HuemulButton
                  variant="outline"
                  size="sm"
                  label={t("form.fill.editResponses")}
                  onClick={() => setMode("edit")}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Badge de estado (Pendiente / Respondido) usado en el header de la sección.
export function FormStatusBadge({ status }: { status?: string }) {
  const { t } = useTranslation("sections");
  const answered = !!status && status !== "pending";
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-normal",
        answered ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
      )}
    >
      {answered ? t("form.fill.statusResponded") : t("form.fill.statusPending")}
    </Badge>
  );
}
