import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulField } from "@/huemul/components/huemul-field";
import { HuemulCheckboxGroup } from "@/huemul/components/huemul-checkbox-group";
import { handleApiError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { updateReviewStatus, updateSectionFormValues } from "@/services/section_execution";
import type { ReviewStatus } from "@/services/section_execution";
import { uploadMedia } from "@/services/media";
import type { FormFieldValue } from "@/types/sections/core";
import { isMediaToken } from "@/lib/plate-media-utils";
import { Check, FileX, Info, Loader2, X } from "lucide-react";
import {
  CUSTOM_FIELD_QUESTION_TYPE,
  NUMERIC_DATA_TYPES,
  QUESTION_TYPE,
  isFieldAnswerable,
  isFieldVisible,
  questionTypeLabel,
  readFieldConfig,
  readFieldOptions,
  resolveOptionLabels,
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
  // Respuesta de multi-select (lista_desplegable_multiple): array de ids seleccionados.
  if (Array.isArray(value)) return value.length > 0;
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

  // ¿Hay al menos un campo editable? Los custom_field son solo lectura y las preguntas
  // condicionales inactivas (can_answer === false) tampoco se pueden responder, así que
  // un formulario compuesto solo por esos no permite editar respuestas.
  const hasEditableFields = sortedFields.some(isFieldAnswerable);

  const [answers, setAnswers] = useState<AnswerMap>(() => buildInitialAnswers(sortedFields));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Set<string>>(new Set());
  // URL de descarga de archivos recién subidos (para previsualizar; el placeholder no es una URL)
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  // true mientras se auto-guarda un disparador y se espera el refetch con is_visible/can_answer
  // recalculados — feedback de "actualizando formulario" para que el cambio no se sienta instantáneo/mágico.
  const [isRecalculating, setIsRecalculating] = useState(false);
  const recalcTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopRecalculating = () => {
    if (recalcTimeoutRef.current) {
      clearTimeout(recalcTimeoutRef.current);
      recalcTimeoutRef.current = null;
    }
    setIsRecalculating(false);
  };

  // field_id de esta sección referenciados por algún depends_on: son los únicos "disparadores"
  // cuyo cambio puede afectar la visibilidad/respondibilidad de otro campo. Al cambiar uno,
  // se auto-guarda para que el backend recalcule is_visible/can_answer (única autoridad).
  const triggerFieldIds = useMemo(() => {
    const ids = new Set<string>();
    for (const f of sortedFields) {
      for (const cond of f.depends_on ?? []) ids.add(cond.field_id);
    }
    return ids;
  }, [sortedFields]);

  // Presencia local: cuando un campo pasa de visible a oculto (is_visible recalculado por el
  // backend), se lo mantiene brevemente renderizado con fade-out en vez de desaparecer de golpe.
  // No decide la visibilidad — solo retrasa el desmontaje de lo que el backend ya ocultó.
  const [exitingFieldIds, setExitingFieldIds] = useState<Set<string>>(new Set());
  const prevVisibleIdsRef = useRef<Set<string>>(new Set(sortedFields.filter(isFieldVisible).map((f) => f.id)));
  useEffect(() => {
    const currentVisibleIds = new Set(sortedFields.filter(isFieldVisible).map((f) => f.id));
    const newlyHidden = [...prevVisibleIdsRef.current].filter((id) => !currentVisibleIds.has(id));
    prevVisibleIdsRef.current = currentVisibleIds;
    if (newlyHidden.length === 0) return;

    setExitingFieldIds((prev) => new Set([...prev, ...newlyHidden]));
    const timeout = setTimeout(() => {
      setExitingFieldIds((prev) => {
        const next = new Set(prev);
        newlyHidden.forEach((id) => next.delete(id));
        return next;
      });
    }, 220);
    return () => clearTimeout(timeout);
  }, [sortedFields]);

  // Campos a renderizar: visibles según el backend, más los que están saliendo con fade-out.
  const displayedFields = useMemo(
    () => sortedFields.filter((f) => isFieldVisible(f) || exitingFieldIds.has(f.id)),
    [sortedFields, exitingFieldIds],
  );

  // Último valor guardado en el backend por snapshot id — evita reenviar un PATCH si el
  // valor del disparador no cambió desde el último auto-guardado (o desde la carga inicial).
  const lastSavedAnswersRef = useRef<AnswerMap>(buildInitialAnswers(sortedFields));
  // Evita solapar un auto-guardado con otro (o con el guardado final del botón).
  const autoSavingRef = useRef(false);

  const editing = isEditing && canInteract && hasEditableFields;

  // Auto-guarda (debounced) los campos "disparadores" de depends_on cuando cambian, para que
  // el backend recalcule is_visible/can_answer y el usuario vea aparecer/ocultarse los campos
  // dependientes sin tener que terminar de llenar el formulario. El front NUNCA decide por su
  // cuenta si un campo se muestra/habilita — solo refleja lo que el backend recalcula tras esto.
  const debouncedAnswers = useDebounce(answers, 500);
  useEffect(() => {
    if (!editing || uploadingFields.size > 0 || isSaving || autoSavingRef.current) return;
    if (triggerFieldIds.size === 0) return;

    const valuesEqual = (a: unknown, b: unknown): boolean =>
      Array.isArray(a) && Array.isArray(b)
        ? a.length === b.length && a.every((v, i) => Object.is(v, b[i]))
        : Object.is(a, b);

    const changed = sortedFields.filter(
      (f) =>
        !!f.field_id &&
        triggerFieldIds.has(f.field_id) &&
        isFieldAnswerable(f) &&
        !valuesEqual(debouncedAnswers[f.id], lastSavedAnswersRef.current[f.id]),
    );
    if (changed.length === 0) return;

    autoSavingRef.current = true;
    // Indicador "actualizando…": se mantiene hasta que lleguen los formFields recalculados
    // (ver efecto sobre `formFields` más abajo) o, si eso no ocurre, tras 5s de seguridad.
    setIsRecalculating(true);
    if (recalcTimeoutRef.current) clearTimeout(recalcTimeoutRef.current);
    recalcTimeoutRef.current = setTimeout(stopRecalculating, 5000);
    const values = changed.map((f) => ({ id: f.id, value: debouncedAnswers[f.id] ?? null }));
    updateSectionFormValues(sectionExecutionId, values, organizationId)
      .then(() => {
        for (const f of changed) lastSavedAnswersRef.current[f.id] = debouncedAnswers[f.id];
        onUpdate?.();
      })
      .catch(() => {
        // Best-effort: si falla, se reintenta en el próximo cambio o al guardar con el botón.
        stopRecalculating();
      })
      .finally(() => {
        autoSavingRef.current = false;
      });
  }, [debouncedAnswers, editing, isSaving, onUpdate, organizationId, sectionExecutionId, sortedFields, triggerFieldIds, uploadingFields]);

  // Los formFields recalculados (is_visible/can_answer) llegaron vía refetch tras el auto-guardado
  // del disparador — el "actualizando…" ya cumplió su propósito.
  useEffect(() => {
    stopRecalculating();
  }, [formFields]);

  // Limpia el timeout de seguridad si el componente se desmonta a mitad de un recálculo.
  useEffect(() => () => {
    if (recalcTimeoutRef.current) clearTimeout(recalcTimeoutRef.current);
  }, []);

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

  // El backend deja el placeholder {{MEDIA:...}} sin resolver cuando el media fue borrado
  // o el usuario no tiene acceso (en vez de fallar todo /content). No confundir con una subida
  // recién hecha en este mismo render: esa siempre tiene un filePreview en paralelo.
  const isBrokenFileField = (field: FormFieldValue): boolean =>
    !filePreviews[field.id] && isMediaToken(answers[field.id]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    for (const f of sortedFields) {
      // custom_field es solo lectura; una pregunta oculta o inactiva (según el backend) no se puede responder
      if (!isFieldAnswerable(f)) continue;
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
        // custom_field es solo lectura; una pregunta oculta o inactiva (según el backend) no se envía
        .filter(isFieldAnswerable)
        // archivo: solo enviar si el usuario subió uno nuevo (placeholder), no la URL existente
        .filter((f) => {
          if (f.question_type !== QUESTION_TYPE.fileUpload) return true;
          const a = answers[f.id];
          return typeof a === "string" && a.startsWith("{{MEDIA:");
        })
        .map((f) => ({ id: f.id, value: answers[f.id] ?? null }));
      await updateSectionFormValues(sectionExecutionId, values, organizationId);
      await updateReviewStatus(sectionExecutionId, "finished" as ReviewStatus, organizationId);
      // Sincroniza lo guardado para que el auto-guardado de disparadores no reenvíe estos valores.
      lastSavedAnswersRef.current = { ...lastSavedAnswersRef.current, ...answers };
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

  // ── Render de un input editable según el tipo de pregunta ──────────────────
  // opts.disabled: campo activo (is_visible) pero no respondible (can_answer=false por
  // show_when_inactive) — se muestra el input real deshabilitado, no un texto de solo lectura.
  const renderInput = (field: FormFieldValue, opts?: { disabled?: boolean }) => {
    const cfg = readFieldConfig(field);
    const value = answers[field.id];
    const error = fieldErrors[field.id];
    const disabled = opts?.disabled;

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
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
          />
        );
      }

      case QUESTION_TYPE.dropdownMultiple: {
        const options = readFieldOptions(field);
        return (
          <HuemulCheckboxGroup
            options={options.map((o) => ({ value: o.id, label: o.label }))}
            value={Array.isArray(value) ? (value as string[]) : []}
            onChange={(next) => setAnswer(field.id, next)}
            error={error}
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
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
        const isBroken = isBrokenFileField(field);

        return (
          <div className="space-y-1.5">
            {isBroken ? (
              <p className="flex items-center gap-1.5 text-sm italic text-gray-400">
                <FileX className="h-3.5 w-3.5" />
                {t("form.fill.fileUnavailable")}
              </p>
            ) : currentUrl && (
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
              disabled={isUploading || disabled}
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
              disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled}
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
            disabled={disabled}
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
      return <span className="text-sm text-gray-800">{resolveOptionLabels(value, options).join(", ")}</span>;
    }

    if (field.question_type === QUESTION_TYPE.dropdownMultiple) {
      const options = readFieldOptions(field);
      return <span className="text-sm text-gray-800">{resolveOptionLabels(value, options).join(", ")}</span>;
    }

    if (field.question_type === QUESTION_TYPE.fileUpload) {
      if (isBrokenFileField(field)) {
        return (
          <span className="flex items-center gap-1.5 text-sm italic text-gray-400">
            <FileX className="h-3.5 w-3.5" />
            {t("form.fill.fileUnavailable")}
          </span>
        );
      }
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
        return <span className="text-sm text-gray-800">{resolveOptionLabels(value, options).join(", ")}</span>;
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
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{t("form.fill.requiredFieldsNote")}</span>
            {isRecalculating && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400 animate-in fade-in duration-200">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t("form.fill.recalculating")}
              </span>
            )}
          </div>
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
        {displayedFields.map((field, index) => {
          const typeHint = questionTypeLabel(field.question_type ?? "", t);
          const isExiting = exitingFieldIds.has(field.id);
          // Campo cuya respuesta puede mostrar/ocultar otras preguntas (referenciado en algún depends_on).
          const isTriggerField =
            editing && !!field.field_id && triggerFieldIds.has(field.field_id) && isFieldAnswerable(field);
          return (
            <div
              key={field.id || index}
              className={cn(
                "space-y-2",
                isExiting
                  ? "pointer-events-none animate-out fade-out slide-out-to-top-2 duration-200"
                  : "animate-in fade-in slide-in-from-top-2 duration-300",
              )}
            >
              <label className="flex items-baseline gap-1.5 text-sm font-semibold text-gray-900">
                <span>
                  {field.field_name}
                  {field.required && <span className="text-red-500"> *</span>}
                </span>
                {typeHint && <span className="text-xs font-normal text-gray-400">· {typeHint}</span>}
              </label>
              {editing && isFieldAnswerable(field)
                ? renderInput(field)
                : editing && isFieldVisible(field) && field.question_type !== CUSTOM_FIELD_QUESTION_TYPE
                  ? renderInput(field, { disabled: true })
                  : renderReadOnly(field)}
              {isTriggerField && (
                <p className="flex items-center gap-1 text-xs text-gray-400">
                  <Info className="h-3 w-3 shrink-0" />
                  {t("form.fill.triggerHint")}
                </p>
              )}
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
