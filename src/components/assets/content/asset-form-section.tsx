import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulField } from "@/huemul/components/huemul-field";
import { handleApiError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";
import { updateReviewStatus, updateSectionFormValues } from "@/services/section_execution";
import type { ReviewStatus } from "@/services/section_execution";
import type { FormFieldValue } from "@/types/sections/core";
import {
  CUSTOM_FIELD_QUESTION_TYPE,
  NUMERIC_DATA_TYPES,
  QUESTION_TYPE,
  questionTypeLabel,
  readFieldConfig,
  readFieldOptions,
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

// Inicializa el mapa de respuestas desde los valores actuales del snapshot.
// Si value es config (array de opciones u objeto de configuración), no es una respuesta → null.
function buildInitialAnswers(fields: FormFieldValue[]): AnswerMap {
  const map: AnswerMap = {};
  for (const f of fields) map[f.id] = hasAnswer(f.value) ? f.value : null;
  return map;
}

// ¿El campo tiene una respuesta no vacía?
// Arrays de objetos (opciones) y objetos planos (config) no son respuestas del usuario.
function hasAnswer(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "object") return false;
  if (typeof value === "string") return value.trim() !== "";
  return true; // number, boolean
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const setAnswer = (fieldId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setFieldErrors((prev) => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    for (const f of sortedFields) {
      const v = answers[f.id];
      if (f.required && !hasAnswer(v)) {
        errs[f.id] = t("form.fill.fieldRequired");
      } else if (hasAnswer(v)) {
        if (f.question_type === QUESTION_TYPE.email) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))) {
            errs[f.id] = t("form.fill.invalidEmail");
          }
        } else if (f.question_type === QUESTION_TYPE.number) {
          if (!Number.isInteger(Number(v))) {
            errs[f.id] = t("form.fill.invalidInteger");
          } else {
            const n = Number(v);
            if (typeof f.min_value === "number" && n < f.min_value) {
              errs[f.id] = t("form.fill.valueTooSmall", { min: f.min_value });
            } else if (typeof f.max_value === "number" && n > f.max_value) {
              errs[f.id] = t("form.fill.valueTooBig", { max: f.max_value });
            }
          }
        } else if (f.question_type === QUESTION_TYPE.decimal) {
          const n = Number(v);
          if (typeof f.min_value === "number" && n < f.min_value) {
            errs[f.id] = t("form.fill.valueTooSmall", { min: f.min_value });
          } else if (typeof f.max_value === "number" && n > f.max_value) {
            errs[f.id] = t("form.fill.valueTooBig", { max: f.max_value });
          }
        }
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error(t("form.fill.requiredError"));
      return;
    }

    setIsSaving(true);
    try {
      const values = sortedFields.map((f) => ({ id: f.id, value: answers[f.id] ?? null }));
      await updateSectionFormValues(sectionExecutionId, values, organizationId);
      await updateReviewStatus(sectionExecutionId, "finished" as ReviewStatus, organizationId);
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
    const error = fieldErrors[field.id];

    switch (field.question_type) {
      case QUESTION_TYPE.shortAnswer:
        return (
          <HuemulField
            type="text"
            label=""
            value={(value as string) ?? ""}
            placeholder={t("form.formFields.previewShortAnswer")}
            onChange={(v) => setAnswer(field.id, v)}
            error={error}
          />
        );

      case QUESTION_TYPE.paragraph:
        return (
          <HuemulField
            type="textarea"
            label=""
            rows={3}
            value={(value as string) ?? ""}
            placeholder={t("form.formFields.previewLongAnswer")}
            onChange={(v) => setAnswer(field.id, v)}
            error={error}
          />
        );

      case QUESTION_TYPE.email:
        return (
          <HuemulField
            type="email"
            label=""
            value={(value as string) ?? ""}
            placeholder={t("form.formFields.previewEmail")}
            onChange={(v) => setAnswer(field.id, v)}
            error={error}
          />
        );

      case QUESTION_TYPE.number:
      case QUESTION_TYPE.decimal: {
        const isDecimal = field.question_type === QUESTION_TYPE.decimal || field.data_type === "decimal";
        return (
          <HuemulField
            type="number"
            label=""
            step={isDecimal ? undefined : 1}
            min={typeof field.min_value === "number" ? field.min_value : undefined}
            max={typeof field.max_value === "number" ? field.max_value : undefined}
            placeholder={isDecimal ? "1.2" : "0"}
            value={value === null || value === undefined ? "" : (value as number)}
            onChange={(v) => setAnswer(field.id, v === "" ? null : Number(v))}
            error={error}
          />
        );
      }

      case QUESTION_TYPE.yesNo: {
        return (
          <HuemulField
            type="yes-no"
            label=""
            value={value as boolean}
            onChange={(v) => setAnswer(field.id, v)}
            error={error}
          />
        );
      }

      case QUESTION_TYPE.multipleChoice: {
        const mcOptions = readFieldOptions(field);
        return (
          <HuemulField
            type="radio"
            label=""
            value={(value as string) ?? ""}
            options={mcOptions.map((o) => ({ value: o.id, label: o.label }))}
            onChange={(v) => setAnswer(field.id, v)}
            error={error}
          />
        );
      }

      case QUESTION_TYPE.dropdown: {
        const ddOptions = readFieldOptions(field);
        return (
          <HuemulField
            type="select"
            label=""
            value={(value as string) ?? ""}
            options={ddOptions.map((o) => ({ value: o.id, label: o.label }))}
            placeholder={t("form.fill.selectOption")}
            onChange={(v) => setAnswer(field.id, v)}
            error={error}
          />
        );
      }

      case QUESTION_TYPE.linearScale: {
        return (
          <HuemulField
            type="linear-scale"
            label=""
            min={typeof field.min_value === "number" ? field.min_value : 1}
            max={typeof field.max_value === "number" ? field.max_value : 5}
            minLabel={cfg.min_label}
            maxLabel={cfg.max_label}
            value={value as number}
            onChange={(v) => setAnswer(field.id, v)}
            error={error}
          />
        );
      }

      case QUESTION_TYPE.rating: {
        return (
          <HuemulField
            type="rating"
            label=""
            max={typeof field.max_value === "number" ? field.max_value : 5}
            value={value as number}
            onChange={(v) => setAnswer(field.id, v)}
            error={error}
          />
        );
      }

      case QUESTION_TYPE.date:
        return (
          <HuemulField
            type="date"
            label=""
            value={(value as string) ?? ""}
            onChange={(v) => setAnswer(field.id, v)}
            error={error}
          />
        );

      case QUESTION_TYPE.time:
        return (
          <HuemulField
            type="time"
            label=""
            value={(value as string) ?? ""}
            onChange={(v) => setAnswer(field.id, v)}
            error={error}
          />
        );

      case QUESTION_TYPE.fileUpload: {
        const fileCfg = readFieldConfig(field);
        const accept = fileCfg.allowed_types?.map((ext) => `.${ext}`).join(", ");
        return (
          <HuemulField
            type="file"
            label=""
            accept={accept}
            onFileChange={(files) => setAnswer(field.id, files)}
            error={error}
          />
        );
      }

      case CUSTOM_FIELD_QUESTION_TYPE:
      default: {
        if (NUMERIC_DATA_TYPES.includes(field.data_type as string)) {
          return (
            <HuemulField
              type="number"
              label=""
              value={value === null || value === undefined ? "" : (value as number)}
              onChange={(v) => setAnswer(field.id, v === "" ? null : Number(v))}
              error={error}
            />
          );
        }
        if (field.data_type === "date") {
          return (
            <HuemulField
              type="date"
              label=""
              value={(value as string) ?? ""}
              onChange={(v) => setAnswer(field.id, v)}
              error={error}
            />
          );
        }
        if (field.data_type === "time") {
          return (
            <HuemulField
              type="time"
              label=""
              value={(value as string) ?? ""}
              onChange={(v) => setAnswer(field.id, v)}
              error={error}
            />
          );
        }
        return (
          <HuemulField
            type="text"
            label=""
            value={(value as string) ?? ""}
            onChange={(v) => setAnswer(field.id, v)}
            error={error}
          />
        );
      }
    }
  };

  // ── Render del valor en solo lectura ───────────────────────────────────────
  const renderReadOnly = (field: FormFieldValue) => {
    const value = answers[field.id];

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
      return (
        <HuemulField
          type="rating"
          label=""
          max={typeof field.max_value === "number" ? field.max_value : 5}
          value={value as number}
          disabled
        />
      );
    }

    if (field.question_type === QUESTION_TYPE.paragraph) {
      return <p className="whitespace-pre-wrap text-sm text-gray-800">{String(value)}</p>;
    }

    if (
      field.question_type === QUESTION_TYPE.multipleChoice ||
      field.question_type === QUESTION_TYPE.dropdown
    ) {
      const options = readFieldOptions(field);
      const selectedId = value as string;
      const found = options.find((o) => o.id === selectedId);
      return <span className="text-sm text-gray-800">{found ? found.label : selectedId}</span>;
    }

    if (
      field.question_type === QUESTION_TYPE.date ||
      (typeof value === "string" && /^\d{4}-\d{2}-\d{2}(T|$)/.test(value))
    ) {
      const dateOnly = (value as string).split("T")[0];
      const [year, month, day] = dateOnly.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      const formatted = date.toLocaleDateString(navigator.language || "es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      return <span className="text-sm text-gray-800">{formatted}</span>;
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
