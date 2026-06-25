import type { CustomFieldDataType } from "@/types/custom-fields/core";

export type Dependency = {
  id: string
  name: string
}

export interface SectionFormField {
  id?: string;                          // id de la fila section_form (presente en lecturas)
  field_id: string;
  field_name: string;
  data_type: CustomFieldDataType;       // auto-derivado del question_type (o del custom field)
  question_type: string;                // requerido — uno del catálogo QuestionType
  required?: boolean;
  order?: number;
  default_value?: unknown | null;       // JSONB — aloja la config de UI (ver FormFieldConfig)
  min_value?: unknown | null;           // JSONB
  max_value?: unknown | null;           // JSONB
  custom_field_id?: string | null;      // solo si question_type === "custom_field"
}

// Valor de un form field en el snapshot de una section_execution (contenido del asset).
// El `id` es el identificador del snapshot usado para PATCH /form_values;
// `section_form_id` referencia la definición (SectionFormField.id) para hacer el join.
export interface FormFieldValue {
  id: string;
  section_form_id: string;
  field_id?: string;
  field_name: string;
  custom_field_id?: string | null;
  value: unknown;
  // Definición embebida por el backend en el contenido del asset (para renderizar el input)
  question_type?: string;
  data_type?: CustomFieldDataType;
  required?: boolean;
  order?: number;
  default_value?: unknown | null;       // config UI (options, startLabel, stars, ...)
  min_value?: unknown | null;
  max_value?: unknown | null;
}

// Una opción de opcion_multiple / lista_desplegable.
// Se persiste como array directo en default_value: [{ id, label }, ...]
export interface FormFieldOption {
  id: string;
  label: string;
}

// Config de UI por tipo de pregunta, persistida dentro de default_value (JSONB).
// Para opcion_multiple / desplegable default_value es FormFieldOption[] (no este objeto).
export interface FormFieldConfig {
  // escala_lineal — etiquetas de extremos
  min_label?: string;
  max_label?: string;
  // carga_de_archivos
  allowed_types?: string[];
  max_size_mb?: number;
}

export interface SortableSectionItem {
  id: string
  name: string
  prompt: string
  order: number
  dependencies: Dependency[]
  type?: "ai" | "manual" | "reference" | "form"
  manual_input?: string
  reference_section_id?: string
  reference_mode?: "latest" | "specific"
  reference_execution_id?: string
  template_section_id?: string
  form_fields?: SectionFormField[]
}

export interface SortableSectionSheetItem {
  id: string
  name: string
  prompt: string
  order: number
  dependencies: Dependency[]
  type?: "ai" | "manual" | "reference" | "form"
  manual_input?: string
  reference_section_id?: string
  reference_mode?: "latest" | "specific"
  reference_execution_id?: string
  template_section_id?: string
  form_fields?: SectionFormField[]
}

export interface SectionCoreItem {
  id: string;
  name: string;
  prompt: string;
  order: number;
  dependencies: { id: string; name: string }[];
}

export interface SectionComponentProps {
  item: SectionCoreItem;
  existingSections: object[];
  onSave: (sectionId: string, sectionData: object) => void;
  onDelete: (sectionId: string) => void;
}
