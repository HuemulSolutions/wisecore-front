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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TFunction } from "i18next";
import type { FormFieldConfig, FormFieldOption, SectionFormField } from "@/types/sections/core";

// question_type que referencia un custom field
export const CUSTOM_FIELD_QUESTION_TYPE = "custom_field";
// data_types que admiten min/max
export const NUMERIC_DATA_TYPES = ["int", "decimal"];

// Catálogo canónico de los 14 question types soportados (slugs del backend).
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
  fileUpload: "carga_de_archivos",
  linearScale: "escala_lineal",
  rating: "calificacion",
  date: "fecha",
  time: "hora",
  customField: CUSTOM_FIELD_QUESTION_TYPE,
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
  booleano: ToggleLeft,
  si_no: ToggleLeft,
};

export const questionTypeIcon = (slug: string): LucideIcon =>
  ICON_MAP[slug] ?? CircleHelp;

// Etiqueta visible de un question_type. Usa i18n por slug con fallback a humanize.
export const questionTypeLabel = (slug: string, t: TFunction): string =>
  slug
    ? t(`form.formFields.questionTypeLabels.${slug}`, { defaultValue: humanizeQuestionType(slug) })
    : "";

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

// Devuelve el nuevo default_value resultante de mergear un patch de config.
export const writeFieldConfig = (
  field: SectionFormField,
  patch: Partial<FormFieldConfig>,
): FormFieldConfig => ({ ...readFieldConfig(field), ...patch });

// Valor JSONB listo para un input controlado (number/string; null/boolean → "")
export const jsonbToInputValue = (v: unknown): string | number =>
  v === null || v === undefined || typeof v === "boolean" ? "" : (v as string | number);

// Genera un field_id seguro a partir del enunciado del campo.
export const slugifyFieldId = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 64) || "";
