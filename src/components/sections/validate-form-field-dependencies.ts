import type { FieldDependencyCondition, SectionFormField } from "@/types/sections/core";
import { NUMERIC_DATA_TYPES, QUESTION_TYPE } from "./question-type-meta";

// Espejo (cliente) de las reglas de validación que el backend aplica al guardar
// form_fields con depends_on. El objetivo es dar feedback inmediato en el builder;
// la validación real y autoritativa sigue siendo la del backend (400 con detalle).
export type FieldDependencyErrorCode =
  | "selfReference"
  | "duplicateReference"
  | "targetNotFound"
  | "ambiguousReference"
  | "numericOnly"
  | "multiSelectOnly"
  | "missingValue";

export interface FieldDependencyConditionError {
  conditionIndex: number;
  code: FieldDependencyErrorCode;
}

const NUMERIC_ONLY_OPERATORS = new Set(["gt", "gte", "lt", "lte"]);
const MULTI_SELECT_ONLY_OPERATORS = new Set(["contains", "not_contains"]);
const LIST_VALUE_OPERATORS = new Set(["in", "not_in"]);
const SCALAR_VALUE_OPERATORS = new Set(["eq", "neq", "gt", "gte", "lt", "lte", "contains", "not_contains"]);

// Valida las condiciones de depends_on de UNA pregunta contra el set de preguntas
// disponibles para referenciar (mismas-sección anteriores + secciones anteriores).
export function validateFieldDependencyConditions(
  ownFieldId: string,
  conditions: FieldDependencyCondition[],
  availableFields: SectionFormField[],
): FieldDependencyConditionError[] {
  const errors: FieldDependencyConditionError[] = [];
  const seenRefs = new Set<string>();

  const countByFieldId = new Map<string, number>();
  availableFields.forEach((f) => {
    const id = f.field_id.trim();
    if (!id) return;
    countByFieldId.set(id, (countByFieldId.get(id) ?? 0) + 1);
  });

  const ownId = ownFieldId.trim();

  conditions.forEach((cond, i) => {
    const targetId = cond.field_id.trim();
    if (!targetId) return; // fila en progreso, sin target elegido aún

    if (ownId && targetId === ownId) {
      errors.push({ conditionIndex: i, code: "selfReference" });
      return;
    }

    if (seenRefs.has(targetId)) {
      errors.push({ conditionIndex: i, code: "duplicateReference" });
    } else {
      seenRefs.add(targetId);
    }

    const target = availableFields.find((f) => f.field_id.trim() === targetId);
    if (!target) {
      errors.push({ conditionIndex: i, code: "targetNotFound" });
      return;
    }

    if ((countByFieldId.get(targetId) ?? 0) > 1) {
      errors.push({ conditionIndex: i, code: "ambiguousReference" });
    }

    if (NUMERIC_ONLY_OPERATORS.has(cond.operator) && !NUMERIC_DATA_TYPES.includes(target.data_type as string)) {
      errors.push({ conditionIndex: i, code: "numericOnly" });
    }

    if (MULTI_SELECT_ONLY_OPERATORS.has(cond.operator) && target.question_type !== QUESTION_TYPE.dropdownMultiple) {
      errors.push({ conditionIndex: i, code: "multiSelectOnly" });
    }

    if (LIST_VALUE_OPERATORS.has(cond.operator) && !(Array.isArray(cond.value) && cond.value.length > 0)) {
      errors.push({ conditionIndex: i, code: "missingValue" });
    } else if (SCALAR_VALUE_OPERATORS.has(cond.operator) && (cond.value === undefined || cond.value === "")) {
      errors.push({ conditionIndex: i, code: "missingValue" });
    }
  });

  return errors;
}

// true si TODAS las preguntas de la sección tienen depends_on válido.
// `earlierSectionsFields` son las preguntas de secciones con order menor (siempre disponibles).
export function formFieldsHaveValidDependencies(
  fields: SectionFormField[],
  earlierSectionsFields: SectionFormField[],
): boolean {
  return fields.every((field, index) => {
    const availableFields = [...fields.slice(0, index), ...earlierSectionsFields];
    const conditions = field.depends_on ?? [];
    return validateFieldDependencyConditions(field.field_id, conditions, availableFields).length === 0;
  });
}
