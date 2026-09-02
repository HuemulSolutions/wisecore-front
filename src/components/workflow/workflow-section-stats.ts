import {
  MULTI_SELECT_QUESTION_TYPES,
  QUESTION_TYPE,
  SINGLE_SELECT_QUESTION_TYPES,
  hasAnswer,
  isFieldAnswerable,
  isFieldVisible,
  normalizeSelectionValue,
} from "@/components/sections/question-type-meta";
import type { ContentSection } from "@/types/assets";
import type { FormFieldValue } from "@/types/sections/core";

// El backend inicializa value = default_value (las opciones de config) en campos de
// selección sin responder — sin normalizar, hasAnswer() los cuenta como respondidos.
// Mismo criterio que FormFieldAnswerValue (ver form-field-answer-value.tsx:41-48).
export function resolvedValueOf(field: FormFieldValue): unknown {
  const isMulti = MULTI_SELECT_QUESTION_TYPES.includes(field.question_type ?? "");
  const isSingle = SINGLE_SELECT_QUESTION_TYPES.includes(field.question_type ?? "");
  return isMulti || isSingle ? normalizeSelectionValue(field.value, isMulti) : field.value;
}

export interface SectionStats {
  fields: FormFieldValue[];
  questions: FormFieldValue[];
  answeredCount: number;
  missingRequired: number;
}

// Espejo cliente de los flags de SECCIÓN calculados por el backend a partir de su propio
// depends_on/show_when_inactive (ver "ia context/dependencias-condicionales-formularios-guide.md"
// §3.2). Igual que isFieldVisible/isFieldAnswerable: el front nunca evalúa depends_on,
// solo lee lo que el backend ya calculó. Ausentes (sin depends_on) equivalen a true.
export function isSectionVisible(section: ContentSection): boolean {
  return section.is_visible !== false;
}
export function isSectionAnswerable(section: ContentSection): boolean {
  return isSectionVisible(section) && section.can_answer !== false;
}

/**
 * Espejo de lectura de `ContentSection.answers_status` (calculado por el backend) —
 * un solo lugar donde vive el literal 'completed'. Fuente única del badge y el tono
 * de las secciones form; NO usar `missingRequired` de computeSectionStats para esto
 * (se mantiene solo para el contador "N/M respondidas" y el cruce de umbral de refetch).
 */
export function isSectionAnswersCompleted(section: Pick<ContentSection, "answers_status">): boolean {
  return section.answers_status === "completed";
}

// missingRequired ya NO decide "completada"/"pendiente" — eso lo resuelve el backend
// vía answers_status (ver isSectionAnswersCompleted arriba). Se mantiene acá solo como
// insumo del contador "N/M respondidas" (answeredCount/questions.length) y para que
// applyFormValuesPatch detecte el cruce de umbral que dispara un refetch de /content.
export function computeSectionStats(section: ContentSection): SectionStats {
  const fields = [...(section.form_fields ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  // Solo preguntas visibles: una oculta por depends_on no está en pantalla,
  // así que tampoco debe sumar al total del contador "respondidas/total".
  const questions = fields.filter((f) => f.question_type !== QUESTION_TYPE.label && isFieldVisible(f));
  const answeredCount = questions.filter((f) => hasAnswer(resolvedValueOf(f))).length;
  // Una sección con `can_edit: false` (permiso por sección resuelto por el backend)
  // o inactiva por su propio depends_on de sección no se puede responder aunque el
  // backend no haya marcado cada campo con `can_answer: false` individualmente
  // (show_when_inactive:true sí lo hace, pero no hay que depender de eso acá) — sin
  // este corte, sus obligatorios sin valor quedarían "pendientes" para siempre en
  // el resumen del wizard.
  const missingRequired =
    section.can_edit === false || !isSectionAnswerable(section)
      ? 0
      : questions.filter((f) => isFieldAnswerable(f) && f.required && !hasAnswer(resolvedValueOf(f))).length;
  return { fields, questions, answeredCount, missingRequired };
}

// Espejo cliente de la regla del backend: una sección "no aplica" por dos motivos
// independientes — (a) depends_on propio de la sección no se cumple (is_visible:false),
// o (b) es tipo form y ninguna de sus preguntas quedó visible. El backend ya no la
// devuelve en /content en ninguno de los dos casos; este helper cubre el intervalo
// entre el parche de caché del PATCH /form_values y el próximo refetch.
export function isSectionApplicable(section: ContentSection): boolean {
  if (!isSectionVisible(section)) return false;
  if (section.section_type !== "form") return true;
  return (section.form_fields ?? []).some(
    (f) => f.question_type !== QUESTION_TYPE.label && isFieldVisible(f),
  );
}
