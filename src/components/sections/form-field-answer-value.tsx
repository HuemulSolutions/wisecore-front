import { useTranslation } from "react-i18next";
import { FileX } from "lucide-react";
import { HuemulField } from "@/huemul/components/huemul-field";
import { HuemulFilePreview } from "@/huemul/components/huemul-file-preview";
import { isMediaToken } from "@/lib/plate-media-utils";
import type { FormFieldValue } from "@/types/sections/core";
import {
  CUSTOM_FIELD_QUESTION_TYPE,
  MULTI_SELECT_QUESTION_TYPES,
  QUESTION_TYPE,
  SINGLE_SELECT_QUESTION_TYPES,
  hasAnswer,
  normalizeSelectionValue,
  readFieldOptions,
  resolveOptionLabels,
} from "@/components/sections/question-type-meta";

// Metadatos reales (nombre/mime) de un archivo subido en la sesión actual — solo
// disponibles mientras la sección sigue montada (filePreviews de AssetFormSection).
// Sin esto, un {{MEDIA:id}} sin resolver se muestra como "archivo no disponible".
export interface FormFieldFilePreview {
  url: string;
  name?: string;
  contentType?: string;
}

interface FormFieldAnswerValueProps {
  field: FormFieldValue;
  /** Valor a mostrar. Si se omite, usa field.value (snapshot del backend). AssetFormSection
   *  pasa answers[field.id], que puede tener ediciones aún no persistidas. */
  value?: unknown;
  filePreview?: FormFieldFilePreview;
}

// Render de solo lectura de la respuesta de un form field, según su question_type.
// Extraído de asset-form-section.tsx para reutilizarse también en paneles de consulta
// (ej. respuestas de secciones anteriores del wizard) sin depender de su estado local.
export function FormFieldAnswerValue({ field, value, filePreview }: FormFieldAnswerValueProps) {
  const { t } = useTranslation("sections");

  // El valor puede venir crudo del caché (field.value): normalizar selects igual que
  // buildInitialAnswers, porque el backend inicializa value = default_value (las opciones
  // de config) en campos de selección sin responder — sin esto se verían todas las
  // opciones como si estuvieran elegidas. Idempotente sobre un valor ya normalizado.
  const raw = value !== undefined ? value : field.value;
  const isMulti = MULTI_SELECT_QUESTION_TYPES.includes(field.question_type ?? "");
  const isSingle = SINGLE_SELECT_QUESTION_TYPES.includes(field.question_type ?? "");
  const resolved = isMulti || isSingle ? normalizeSelectionValue(raw, isMulti) : raw;

  if (!hasAnswer(resolved)) {
    return <span className="text-sm italic text-gray-400">{t("form.fill.noAnswer")}</span>;
  }

  if (field.question_type === QUESTION_TYPE.yesNo) {
    return (
      <span className="text-sm text-gray-800">
        {resolved ? t("form.formFields.previewYes") : t("form.formFields.previewNo")}
      </span>
    );
  }

  if (field.question_type === QUESTION_TYPE.rating) {
    return (
      <HuemulField
        type="rating"
        label=""
        max={typeof field.max_value === "number" ? field.max_value : 5}
        value={resolved as number}
        disabled
      />
    );
  }

  if (field.question_type === QUESTION_TYPE.paragraph) {
    return <p className="whitespace-pre-wrap text-sm text-gray-800">{String(resolved)}</p>;
  }

  if (
    field.question_type === QUESTION_TYPE.multipleChoice ||
    field.question_type === QUESTION_TYPE.dropdown
  ) {
    const options = readFieldOptions(field);
    return <span className="text-sm text-gray-800">{resolveOptionLabels(resolved, options).join(", ")}</span>;
  }

  if (field.question_type === QUESTION_TYPE.dropdownMultiple) {
    const options = readFieldOptions(field);
    return <span className="text-sm text-gray-800">{resolveOptionLabels(resolved, options).join(", ")}</span>;
  }

  if (field.question_type === QUESTION_TYPE.fileUpload) {
    if (!filePreview && isMediaToken(resolved)) {
      return (
        <span className="flex items-center gap-1.5 text-sm italic text-gray-400">
          <FileX className="h-3.5 w-3.5" />
          {t("form.fill.fileUnavailable")}
        </span>
      );
    }
    const meta = filePreview ?? (typeof resolved === "string" && resolved.startsWith("http") ? { url: resolved } : null);
    if (!meta) return <span className="text-sm italic text-gray-400">{t("form.fill.noAnswer")}</span>;
    return (
      <HuemulFilePreview
        url={meta.url}
        fileName={meta.name}
        contentType={meta.contentType}
        alt={field.field_name}
        downloadLabel={t("form.fill.fileDownload")}
      />
    );
  }

  if (field.question_type === CUSTOM_FIELD_QUESTION_TYPE) {
    if (field.data_type === "image") {
      return (
        <HuemulFilePreview
          url={String(resolved)}
          alt={field.field_name}
          downloadLabel={t("form.fill.fileDownload")}
        />
      );
    }
    if (field.data_type === "url") {
      const url = String(resolved);
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
      const isYes = resolved === true || resolved === "true" || resolved === 1;
      return (
        <span className="text-sm text-gray-800">
          {isYes ? t("form.formFields.previewYes") : t("form.formFields.previewNo")}
        </span>
      );
    }
    if (field.data_type === "list") {
      const options = readFieldOptions(field);
      return <span className="text-sm text-gray-800">{resolveOptionLabels(resolved, options).join(", ")}</span>;
    }
    // date / time / numéricos / string → caen al manejo genérico de abajo
  }

  if (
    field.question_type === QUESTION_TYPE.date ||
    (typeof resolved === "string" && /^\d{4}-\d{2}-\d{2}(T|$)/.test(resolved))
  ) {
    const dateOnly = (resolved as string).split("T")[0];
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
    typeof resolved === "string"
  ) {
    // Mostrar HH:MM (sin segundos)
    return <span className="text-sm text-gray-800">{resolved.slice(0, 5)}</span>;
  }

  return <span className="text-sm text-gray-800">{String(resolved)}</span>;
}
