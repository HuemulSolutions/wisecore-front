import {
  Type,
  AlignLeft,
  Hash,
  Sigma,
  SlidersHorizontal,
  Calendar,
  Clock,
  Puzzle,
  Image,
  CheckSquare,
  CircleDot,
  ListChecks,
  ToggleLeft,
  Mail,
  Upload,
  Star,
  CircleHelp,
  Heading,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TFunction } from "i18next";
import type { FormFieldConfig, FormFieldOption, FormFieldValue, SectionFormField } from "@/types/sections/core";
import { isMediaToken } from "@/lib/plate-media-utils";

// question_type que referencia un custom field
export const CUSTOM_FIELD_QUESTION_TYPE = "custom_field";
// question_type puramente visual: separador/título de sub-sección, no se responde ni se
// persiste valor. No es un control editable — no lleva case en HuemulQuestionInput, se
// detecta a nivel de loop en cada consumidor (ver ia context/question-type-input-guide.md).
export const LABEL_QUESTION_TYPE = "etiqueta";
// data_types que admiten min/max
export const NUMERIC_DATA_TYPES = ["int", "decimal"];

// Catálogo canónico de los 15 question types soportados (slugs del backend).
// ⚠️ Deben coincidir con los slugs reales que devuelve /question_types/.
export const QUESTION_TYPE = {
  shortAnswer: "respuesta_corta",
  paragraph: "parrafo",
  number: "respuesta_numerica",
  decimal: "respuesta_decimal",
  email: "email",
  yesNo: "booleano",
  multipleChoice: "opcion_multiple",
  dropdown: "lista_desplegable",
  dropdownMultiple: "lista_desplegable_multiple",
  fileUpload: "carga_de_archivos",
  linearScale: "escala_lineal",
  rating: "calificacion",
  date: "fecha",
  time: "hora",
  customField: CUSTOM_FIELD_QUESTION_TYPE,
  label: LABEL_QUESTION_TYPE,
} as const;

// Estado de edición de un form field con una clave transitoria para dnd-kit
// (no se persiste en el backend — se strippea al enviar).
export type FormFieldDraft = SectionFormField & { __key: string };

// Contador compartido para generar claves transitorias únicas de dnd-kit.
let keySeq = 0;
export const nextFieldKey = (): string => `ff-${++keySeq}`;
export const withFieldKey = (f: SectionFormField): FormFieldDraft => ({ ...f, __key: nextFieldKey() });

// Quita la clave transitoria __key antes de enviar el field al backend.
export const stripFieldKey = (f: FormFieldDraft): SectionFormField => {
  const rest = { ...f } as Partial<FormFieldDraft>;
  delete rest.__key;
  return rest as SectionFormField;
};

// Etiqueta legible para un question_type (slug del backend, ej. "respuesta_corta")
export const humanizeQuestionType = (slug: string): string =>
  slug ? slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

// Mapa best-effort slug → icono. Fallback a CircleHelp para slugs desconocidos.
const ICON_MAP: Record<string, LucideIcon> = {
  respuesta_corta: Type,
  respuesta_larga: AlignLeft,
  parrafo: AlignLeft,
  respuesta_decimal: Sigma,
  respuesta_numerica: Hash,
  numero: Hash,
  email: Mail,
  respuesta_email: Mail,
  escala_lineal: SlidersHorizontal,
  calificacion: Star,
  carga_de_archivos: Upload,
  archivo: Upload,
  fecha: Calendar,
  hora: Clock,
  custom_field: Puzzle,
  imagen: Image,
  casillas: CheckSquare,
  opcion_multiple: CircleDot,
  lista_desplegable: ListChecks,
  lista_desplegable_multiple: CheckSquare,
  booleano: ToggleLeft,
  si_no: ToggleLeft,
  etiqueta: Heading,
};

export const questionTypeIcon = (slug: string): LucideIcon =>
  ICON_MAP[slug] ?? CircleHelp;

// Etiqueta visible de un question_type. Usa i18n por slug con fallback a humanize.
export const questionTypeLabel = (slug: string, t: TFunction): string =>
  slug
    ? t(`form.formFields.questionTypeLabels.${slug}`, { defaultValue: humanizeQuestionType(slug) })
    : "";

// Etiqueta visible de un data_type de custom field (namespace custom-fields).
export const customFieldDataTypeLabel = (dataType: string, t: TFunction): string =>
  dataType
    ? t(`custom-fields:dataTypes.${dataType}`, { defaultValue: dataType })
    : "";

// Placeholder de ejemplo por question_type — única fuente de verdad para que el
// placeholder mostrado al responder (asset-form-section.tsx) y el de la vista previa
// (question-type-preview.tsx) nunca diverjan.
export function getQuestionTypePlaceholder(
  questionType: string | null | undefined,
  t: TFunction,
): string | undefined {
  switch (questionType) {
    case QUESTION_TYPE.shortAnswer:
      return t("form.formFields.previewShortAnswer");
    case QUESTION_TYPE.paragraph:
      return t("form.formFields.previewLongAnswer");
    case QUESTION_TYPE.email:
      return t("form.formFields.previewEmail");
    case QUESTION_TYPE.number:
      return "0";
    case QUESTION_TYPE.decimal:
      return "1.2";
    case QUESTION_TYPE.dropdown:
      return t("form.fill.selectOption");
    case QUESTION_TYPE.dropdownMultiple:
      return t("form.fill.selectOptions");
    default:
      return undefined;
  }
}

// ── Config de UI alojada en default_value (JSONB) ───────────────────────────

// Lee la config de un field de forma segura (objeto plano; {} si null/legacy/array).
// Para opcion_multiple y desplegable usar readFieldOptions en su lugar.
export const readFieldConfig = (field: { default_value?: unknown | null }): FormFieldConfig => {
  const raw = field.default_value;
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as FormFieldConfig)
    : {};
};

// Lee las opciones de opcion_multiple / desplegable desde default_value.
// El backend persiste un array directo de FormFieldOption; retorna [] si el valor no es un array.
export const readFieldOptions = (field: { default_value?: unknown | null }): FormFieldOption[] => {
  const raw = field.default_value;
  return Array.isArray(raw) ? (raw as FormFieldOption[]) : [];
};

// Resuelve el valor de una respuesta de selección a etiquetas visibles.
// Acepta: id (string), opción {id, label}, o array de cualquiera (datos legacy/backend).
// Nunca retorna el valor crudo — evita renderizar objetos directamente en JSX.
export function resolveOptionLabels(value: unknown, options: FormFieldOption[]): string[] {
  const toLabel = (entry: unknown): string => {
    if (entry && typeof entry === "object") {
      const opt = entry as { id?: unknown; label?: unknown };
      if (typeof opt.label === "string") return opt.label;
      const byId = options.find((o) => o.id === String(opt.id ?? ""));
      return byId?.label ?? String(opt.id ?? "");
    }
    const id = String(entry);
    return options.find((o) => o.id === id)?.label ?? id;
  };
  return (Array.isArray(value) ? value : [value]).map(toLabel);
}

// Devuelve el nuevo default_value resultante de mergear un patch de config.
export const writeFieldConfig = (
  field: SectionFormField,
  patch: Partial<FormFieldConfig>,
): FormFieldConfig => ({ ...readFieldConfig(field), ...patch });

// Valor JSONB listo para un input controlado (number/string; null/boolean → "")
export const jsonbToInputValue = (v: unknown): string | number =>
  v === null || v === undefined || typeof v === "boolean" ? "" : (v as string | number);

// question_types de selección single / multi — usados para normalizar el value que
// llega desde el backend (ver normalizeSelectionValue).
export const SINGLE_SELECT_QUESTION_TYPES: string[] = [QUESTION_TYPE.multipleChoice, QUESTION_TYPE.dropdown];
export const MULTI_SELECT_QUESTION_TYPES: string[] = [QUESTION_TYPE.dropdownMultiple];

// question_types cuyo valor se escribe carácter por carácter: el autoguardado espera a que
// el campo pierda el foco (no hay "valor a medio hacer" en los demás, donde un click ya es
// un valor completo). Ver ia context/question-type-input-guide.md.
export const FREE_TEXT_QUESTION_TYPES: string[] = [
  QUESTION_TYPE.shortAnswer,
  QUESTION_TYPE.paragraph,
  QUESTION_TYPE.email,
  QUESTION_TYPE.number,
  QUESTION_TYPE.decimal,
];

// data_types que HuemulQuestionInput resuelve con un widget atómico en su fallback
// (question_type nulo/legacy) — todo lo demás del fallback es un input de texto.
const ATOMIC_FALLBACK_DATA_TYPES = ["bool", "date", "time", "datetime", "list"];

// Clasifica un campo como texto libre (guardado al blur) o atómico (guardado al cambiar).
// Default para question_type desconocido/legacy: texto libre — es el camino seguro.
export const isFreeTextField = (field: { question_type?: string | null; data_type?: string | null }): boolean =>
  FREE_TEXT_QUESTION_TYPES.includes(field.question_type ?? "")
    ? true
    : !field.question_type || !Object.values(QUESTION_TYPE).includes(field.question_type as never)
      ? !ATOMIC_FALLBACK_DATA_TYPES.includes(field.data_type ?? "")
      : false;

// Extrae los ids seleccionados de un value de selección, descartando los objetos-opción
// (el backend inicializa value = default_value en campos sin responder, y default_value
// para estos question_types es el array de opciones de config, no una respuesta). La
// respuesta real siempre son entradas primitivas (id string/number); los objetos {id,label}
// son ruido de config y se descartan. isMulti → string[]; single → string | null.
export function normalizeSelectionValue(value: unknown, isMulti: boolean): string[] | string | null {
  const entries = Array.isArray(value) ? value : [value];
  const ids = entries
    .filter((e) => e != null && typeof e !== "object")
    .map((e) => String(e));
  return isMulti ? ids : (ids[0] ?? null);
}

// Genera un field_id seguro a partir del enunciado del campo.
export const slugifyFieldId = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 64) || "";

// ── Dependencias condicionales (depends_on) en tiempo de ejecución ──────────

// ¿El front debe mostrar la pregunta? false solo cuando el backend calculó
// is_visible === false (depends_on inactivo y show_when_inactive en false/ausente).
export function isFieldVisible(field: FormFieldValue): boolean {
  return field.is_visible !== false;
}

// ¿El usuario puede responder la pregunta? custom_field siempre es solo lectura;
// etiqueta es puramente visual (no hay nada que responder); una pregunta condicional
// inactiva (can_answer === false) también lo es, aunque se muestre deshabilitada por
// show_when_inactive.
export function isFieldAnswerable(field: FormFieldValue): boolean {
  if (field.question_type === CUSTOM_FIELD_QUESTION_TYPE) return false;
  if (field.question_type === LABEL_QUESTION_TYPE) return false;
  if (field.is_visible === false) return false;
  if (field.can_answer === false) return false;
  return true;
}

// ¿El campo tiene una respuesta no vacía?
// Arrays de objetos (opciones) y objetos planos (config) no son respuestas del usuario.
export function hasAnswer(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  // Respuesta de multi-select (lista_desplegable_multiple): array de ids seleccionados.
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return false;
  if (typeof value === "string") return value.trim() !== "";
  return true; // number, boolean
}

// Formatea el valor de un form field como texto plano, para copiar al portapapeles.
// Replica en texto las ramas de renderReadOnly (asset-form-section.tsx) sin JSX.
export function formatFieldValueForCopy(field: FormFieldValue, t: TFunction): string {
  const value = field.value;

  // Etiqueta: solo el título, sin "sin respuesta" (no es una pregunta real).
  if (field.question_type === LABEL_QUESTION_TYPE) return field.field_name;

  if (!hasAnswer(value)) return t("sections:form.fill.noAnswer");

  if (field.question_type === QUESTION_TYPE.yesNo) {
    return value ? t("sections:form.formFields.previewYes") : t("sections:form.formFields.previewNo");
  }

  if (field.question_type === QUESTION_TYPE.rating || field.question_type === QUESTION_TYPE.paragraph) {
    return String(value);
  }

  if (
    field.question_type === QUESTION_TYPE.multipleChoice ||
    field.question_type === QUESTION_TYPE.dropdown ||
    field.question_type === QUESTION_TYPE.dropdownMultiple
  ) {
    return resolveOptionLabels(value, readFieldOptions(field)).join(", ");
  }

  if (field.question_type === QUESTION_TYPE.fileUpload) {
    if (isMediaToken(value)) return t("sections:form.fill.fileUnavailable");
    if (typeof value === "string" && value.startsWith("http")) return value;
    return t("sections:form.fill.noAnswer");
  }

  if (field.question_type === CUSTOM_FIELD_QUESTION_TYPE) {
    if (field.data_type === "image" || field.data_type === "url") return String(value);
    if (field.data_type === "bool") {
      const isYes = value === true || value === "true" || value === 1;
      return isYes ? t("sections:form.formFields.previewYes") : t("sections:form.formFields.previewNo");
    }
    if (field.data_type === "list") {
      return resolveOptionLabels(value, readFieldOptions(field)).join(", ");
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
    return date.toLocaleDateString(navigator.language || "es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  if ((field.question_type === QUESTION_TYPE.time || field.data_type === "time") && typeof value === "string") {
    return value.slice(0, 5);
  }

  return String(value);
}
