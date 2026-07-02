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
import { uploadMedia } from "@/services/media";
import type { FormFieldValue } from "@/types/sections/core";
import { Check, Loader2, X } from "lucide-react";
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
  /** document_id del asset → se pasa como parent_id al subir archivos a /media/ */
  documentId?: string;
  /** Si el usuario puede responder/editar el formulario (modo editor + permiso). Si es false, solo lectura. */
  canInteract: boolean;
  /** Modo edición, controlado por el padre (mismo botón de lápiz que las demás secciones). */
  isEditing: boolean;
  /** El padre sale del modo edición (cancelar o tras guardar). */
  onExitEditing: () => void;
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
  organizationId,
  documentId,
  canInteract,
  isEditing,
  onExitEditing,
  responderName,
  respondedAt,
  onUpdate,
}: AssetFormSectionProps) {
  const { t } = useTranslation(["sections", "common"]);

  const sortedFields = useMemo(
    () => [...formFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [formFields],
  );

  // ¿Hay al menos un campo editable? Los custom_field son solo lectura
  // (se gestionan en la configuración de secciones), así que un formulario
  // compuesto solo por custom_field no permite editar respuestas.
  const hasEditableFields = sortedFields.some(
    (f) => f.question_type !== CUSTOM_FIELD_QUESTION_TYPE,
  );

  const [answers, setAnswers] = useState<AnswerMap>(() => buildInitialAnswers(sortedFields));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Set<string>>(new Set());
  // URL de descarga de archivos recién subidos (para previsualizar; el placeholder no es una URL)
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});

  const setAnswer = (fieldId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setFieldErrors((prev) => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  // URL a mostrar para un campo de archivo: la subida nueva (filePreviews) o la URL original del backend.
  const fileDisplayUrl = (field: FormFieldValue): string | null => {
    const preview = filePreviews[field.id];
    if (preview) return preview;
    const v = answers[field.id];
    if (typeof v === "string" && v.startsWith("http")) return v;
    return null;
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    for (const f of sortedFields) {
      // Los custom_field son solo lectura (su valor se gestiona en los custom fields del documento)
      if (f.question_type === CUSTOM_FIELD_QUESTION_TYPE) continue;
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
    if (uploadingFields.size > 0) {
      toast.error(t("form.fill.fileUploading_block"));
      return;
    }
    if (!validate()) {
      toast.error(t("form.fill.requiredError"));
      return;
    }

    setIsSaving(true);
    try {
      const values = sortedFields
        // custom_field es solo lectura: su valor se gestiona en los custom fields del documento
        .filter((f) => f.question_type !== CUSTOM_FIELD_QUESTION_TYPE)
        // archivo: solo enviar si el usuario subió uno nuevo (placeholder), no la URL existente
        .filter((f) => {
          if (f.question_type !== QUESTION_TYPE.fileUpload) return true;
          const a = answers[f.id];
          return typeof a === "string" && a.startsWith("{{MEDIA:");
        })
        .map((f) => ({ id: f.id, value: answers[f.id] ?? null }));
      await updateSectionFormValues(sectionExecutionId, values, organizationId);
      await updateReviewStatus(sectionExecutionId, "finished" as ReviewStatus, organizationId);
      toast.success(t("form.fill.saved"));
      onExitEditing();
      onUpdate?.();
    } catch (error) {
      handleApiError(error, { fallbackMessage: t("form.fill.saveError") });
    } finally {
      setIsSaving(false);
    }
  };

  // Descarta los cambios en curso y vuelve a solo lectura.
  const handleCancel = () => {
    setAnswers(buildInitialAnswers(sortedFields));
    setFieldErrors({});
    onExitEditing();
  };

  if (sortedFields.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
        {t("form.fill.emptyForm")}
      </div>
    );
  }

  const editing = isEditing && canInteract && hasEditableFields;

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
            withSeconds={false}
          />
        );

      case QUESTION_TYPE.fileUpload: {
        const fileCfg = readFieldConfig(field);
        const accept = fileCfg.allowed_types?.map((ext) => `.${ext}`).join(", ");
        const isUploading = uploadingFields.has(field.id);

        const handleFileChange = async (files: FileList | null) => {
          if (!files || files.length === 0) return;
          const file = files[0];

          if (fileCfg.allowed_types?.length) {
            const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
            if (!fileCfg.allowed_types.includes(ext)) {
              setFieldErrors((prev) => ({
                ...prev,
                [field.id]: t("form.fill.fileTypeNotAllowed", { types: fileCfg.allowed_types!.join(", ") }),
              }));
              return;
            }
          }

          if (fileCfg.max_size_mb) {
            const sizeMb = file.size / (1024 * 1024);
            if (sizeMb > fileCfg.max_size_mb) {
              setFieldErrors((prev) => ({
                ...prev,
                [field.id]: t("form.fill.fileTooLarge", { max: fileCfg.max_size_mb }),
              }));
              return;
            }
          }

          setFieldErrors((prev) => { const next = { ...prev }; delete next[field.id]; return next; });
          setUploadingFields((prev) => new Set([...prev, field.id]));

          try {
            const media = await uploadMedia(organizationId!, {
              file,
              level: "document",
              parent_id: documentId,
            });
            setAnswer(field.id, `{{MEDIA:${media.id}}}`);
            setFilePreviews((prev) => ({ ...prev, [field.id]: media.current_version?.download_url ?? "" }));
          } catch {
            setFieldErrors((prev) => ({ ...prev, [field.id]: t("form.fill.fileUploadError") }));
          } finally {
            setUploadingFields((prev) => { const next = new Set(prev); next.delete(field.id); return next; });
          }
        };

        const currentUrl = fileDisplayUrl(field);

        return (
          <div className="space-y-1.5">
            {currentUrl && (
              field.data_type === "image" ? (
                <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                  <img src={currentUrl} alt={field.field_name} className="max-h-48 rounded border border-gray-200 object-contain" />
                </a>
              ) : (
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 underline underline-offset-2 hover:text-blue-800"
                >
                  {t("form.fill.fileDownload")}
                </a>
              )
            )}
            <HuemulField
              type="file"
              label=""
              accept={accept}
              disabled={isUploading}
              onFileChange={handleFileChange}
              error={error}
            />
            {isUploading && (
              <p className="flex items-center gap-1.5 text-xs text-gray-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t("form.fill.fileUploading")}
              </p>
            )}
          </div>
        );
      }

      case CUSTOM_FIELD_QUESTION_TYPE:
        // Solo lectura: el valor se gestiona en los custom fields del documento
        return renderReadOnly(field);

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
              withSeconds={false}
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

    if (field.question_type === QUESTION_TYPE.fileUpload) {
      const url = fileDisplayUrl(field);
      if (!url) return <span className="text-sm italic text-gray-400">{t("form.fill.noAnswer")}</span>;
      if (field.data_type === "image") {
        return (
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-block">
            <img src={url} alt={field.field_name} className="max-h-48 rounded border border-gray-200 object-contain" />
          </a>
        );
      }
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 underline underline-offset-2 hover:text-blue-800"
        >
          {t("form.fill.fileDownload")}
        </a>
      );
    }

    if (field.question_type === CUSTOM_FIELD_QUESTION_TYPE) {
      if (field.data_type === "image") {
        const url = String(value);
        return (
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-block">
            <img src={url} alt={field.field_name} className="max-h-48 rounded border border-gray-200 object-contain" />
          </a>
        );
      }
      if (field.data_type === "url") {
        const url = String(value);
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 underline underline-offset-2 hover:text-blue-800 break-all"
          >
            {url}
          </a>
        );
      }
      if (field.data_type === "bool") {
        const isYes = value === true || value === "true" || value === 1;
        return (
          <span className="text-sm text-gray-800">
            {isYes ? t("form.formFields.previewYes") : t("form.formFields.previewNo")}
          </span>
        );
      }
      if (field.data_type === "list") {
        const options = readFieldOptions(field);
        const selectedId = String(value);
        const found = options.find((o) => o.id === selectedId);
        return <span className="text-sm text-gray-800">{found ? found.label : selectedId}</span>;
      }
      // date / time / numéricos / string → caen al manejo genérico de abajo
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
        month: "2-digit",
        year: "numeric",
      });
      return <span className="text-sm text-gray-800">{formatted}</span>;
    }

    if (
      (field.question_type === QUESTION_TYPE.time || field.data_type === "time") &&
      typeof value === "string"
    ) {
      // Mostrar HH:MM (sin segundos)
      return <span className="text-sm text-gray-800">{value.slice(0, 5)}</span>;
    }

    return <span className="text-sm text-gray-800">{String(value)}</span>;
  };

  return (
    <div className="w-full">
      {/* Barra de guardar/cancelar, arriba, igual que al editar contenido Plate */}
      {editing && (
        <div className="sticky top-9 z-40 mb-4 flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white/95 px-3 py-2 backdrop-blur-sm shadow-sm">
          <span className="text-xs text-gray-400">{t("form.fill.requiredFieldsNote")}</span>
          <div className="flex items-center gap-2">
            <HuemulButton
              variant="outline"
              size="sm"
              icon={X}
              disabled={isSaving}
              label={t("common:cancel")}
              onClick={handleCancel}
            />
            <HuemulButton
              variant="default"
              size="sm"
              icon={Check}
              className="bg-[#4464f7] hover:bg-[#3451e6]"
              loading={isSaving}
              label={isSaving ? t("common:saving") : t("form.fill.submitResponses")}
              onClick={handleSubmit}
            />
          </div>
        </div>
      )}

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

      {/* Footer: solo info de quien respondió, en modo lectura */}
      {!editing && responderName && (
        <div className="mt-5 border-t border-gray-100 pt-3">
          <span className="text-xs text-gray-400">
            {respondedAt
              ? t("form.fill.respondedBy", {
                  name: responderName,
                  date: new Date(respondedAt).toLocaleString(),
                })
              : responderName}
          </span>
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
