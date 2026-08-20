import type { CustomFieldDataType } from "@/types/custom-fields/core";

export type Dependency = {
  id: string
  name: string
}

// Operadores soportados por depends_on (ver "ia context/dependencias-condicionales-formularios-guide.md").
export type FieldDependencyOperator =
  | "eq" | "neq" | "gt" | "gte" | "lt" | "lte"
  | "in" | "not_in" | "contains" | "not_contains"
  | "is_empty" | "is_not_empty";

// Una condición de depends_on: todas las condiciones de un field se combinan con AND.
export interface FieldDependencyCondition {
  field_id: string;
  operator: FieldDependencyOperator;
  value?: unknown; // omitido/ignorado para is_empty / is_not_empty
}

// Dependencia condicional a nivel de SECCIÓN (mismo formato y operadores que a nivel
// de pregunta, ver "ia context/dependencias-condicionales-formularios-guide.md" §3.2).
// Aplica a cualquier tipo de sección (form/manual/ai/reference), no solo `form`.
export interface SectionDependencyConfig {
  depends_on?: FieldDependencyCondition[] | null;
  show_when_inactive?: boolean;
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
  depends_on?: FieldDependencyCondition[] | null;
  show_when_inactive?: boolean;
}

// Valor de un form field en el snapshot de una section_execution (contenido del asset).
// El `id` es el identificador del snapshot usado para PATCH /form_values;
// `section_form_id` referencia la definición (SectionFormField.id) para hacer el join.
export interface FormFieldValue {
  id: string;
  section_execution_id?: string;
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
  depends_on?: FieldDependencyCondition[] | null;
  show_when_inactive?: boolean;
  // Calculados por el backend a partir de depends_on/show_when_inactive y las respuestas actuales.
  is_visible?: boolean;
  can_answer?: boolean;
}

// Respuesta de PATCH /section_executions/{id}/form_values: agrupada por sección
// tipo form afectada (la editada + toda sección form cuyas preguntas dependan,
// directa o indirectamente, de un valor que cambió). Nunca incluye secciones
// ai/manual/reference (esos tipos no tienen form_fields).
export interface FormValuesSectionPayload {
  section_execution_id: string;
  // null si la sección no tiene nombre asignado ni en la ejecución ni en la sección
  // del documento (mismo criterio que current_step.section_name en GET /workflows/).
  // Vive a nivel del grupo, una vez por sección — no dentro de cada form_field.
  section_name: string | null;
  form_fields: FormFieldValue[];
}

// Request de PATCH /section_executions/{id}/form_answer: una sola respuesta.
// `id` es el FormFieldValue.id (snapshot), no el field_id. `value` puede ser null para vaciar.
export interface FormAnswerRequest {
  id: string;
  value: unknown;
}

// Respuesta de PATCH /section_executions/{id}/form_answer. A diferencia de form_values,
// es por sección: form_fields trae solo las preguntas de la section_execution respondida.
// No incluye section_name (a diferencia de FormValuesSectionPayload) — si se necesita en
// este flujo hay que resolverlo aparte (ej. ContentSection.section_name de /content).
export interface FormAnswerPayload {
  answered_field: FormFieldValue;
  // Próxima pregunta visible y respondible sin valor; null cuando no queda ninguna.
  next_question: FormFieldValue | null;
  is_complete: boolean;
  // Cuentan solo preguntas visibles; pueden variar entre respuestas si se activan/desactivan dependientes.
  total_questions: number;
  answered_questions: number;
  form_fields: FormFieldValue[];
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

export interface SortableSectionItem extends SectionDependencyConfig {
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

export interface SortableSectionSheetItem extends SectionDependencyConfig {
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
