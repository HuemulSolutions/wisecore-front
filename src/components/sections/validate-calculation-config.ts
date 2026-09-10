import type {
  ConditionalBranch,
  ConditionalRuleNode,
  FormulaCalculationConfig,
  FormulaTerm,
  SectionFormField,
} from "@/types/sections/core";
import {
  CONDITIONAL_QUESTION_TYPE,
  FORMULA_QUESTION_TYPE,
  NUMERIC_DATA_TYPES,
  isCalculatedField,
} from "./question-type-meta";
import { validateFieldDependencyConditions } from "./validate-form-field-dependencies";

// Máx. de niveles de anidamiento de un árbol condicional (mismo límite que el backend,
// ver "ia context/campos-calculados-en-formularios-guide.md"). La raíz cuenta como nivel 1.
export const MAX_CALCULATION_DEPTH = 10;

// Espejo (cliente) de las reglas de validación que el backend aplica al guardar
// calculation_config. El objetivo es dar feedback inmediato en el builder; la validación
// real y autoritativa sigue siendo la del backend (400 con detalle).
export type CalculationErrorCode =
  | "missingConfig"
  | "configNotAllowed"
  | "modeMismatch"
  | "emptyTerms"
  | "termFieldRequired"
  | "termNotFound"
  | "termSelfReference"
  | "termNotNumeric"
  | "termAmbiguous"
  | "invalidMultiplier"
  | "emptyConditions"
  | "invalidCondition"
  | "nestingTooDeep"
  | "branchValueRequired";

/** `path` localiza el error en el árbol: "terms[1]", "root.if", "root.else.then". */
export interface CalculationConfigError {
  path: string;
  code: CalculationErrorCode;
}

function validateFormula(
  ownFieldId: string,
  config: FormulaCalculationConfig,
  availableFields: SectionFormField[],
): CalculationConfigError[] {
  const errors: CalculationConfigError[] = [];
  const terms = config.terms ?? [];
  if (terms.length === 0) {
    errors.push({ path: "terms", code: "emptyTerms" });
  }

  // Mismo criterio que validateFieldDependencyConditions: un field_id ambiguo (existe en
  // más de una sección anterior) no se puede referenciar.
  const countByFieldId = new Map<string, number>();
  availableFields.forEach((f) => {
    const id = f.field_id.trim();
    if (!id) return;
    countByFieldId.set(id, (countByFieldId.get(id) ?? 0) + 1);
  });
  const ownId = ownFieldId.trim();

  terms.forEach((term: FormulaTerm, i: number) => {
    const path = `terms[${i}]`;
    const targetId = term.field_id?.trim() ?? "";
    if (!targetId) {
      errors.push({ path, code: "termFieldRequired" });
      return;
    }
    if (ownId && targetId === ownId) {
      errors.push({ path, code: "termSelfReference" });
      return;
    }
    const target = availableFields.find((f) => f.field_id.trim() === targetId);
    if (!target) {
      errors.push({ path, code: "termNotFound" });
      return;
    }
    if ((countByFieldId.get(targetId) ?? 0) > 1) {
      errors.push({ path, code: "termAmbiguous" });
    }
    if (!NUMERIC_DATA_TYPES.includes(target.data_type as string)) {
      errors.push({ path, code: "termNotNumeric" });
    }
    if (term.multiplier !== undefined && !Number.isFinite(term.multiplier)) {
      errors.push({ path, code: "invalidMultiplier" });
    }
  });

  return errors;
}

function validateBranch(
  ownFieldId: string,
  branch: ConditionalBranch,
  availableFields: SectionFormField[],
  path: string,
  depth: number,
): CalculationConfigError[] {
  if (branch.type === "value") {
    return branch.value === undefined ? [{ path, code: "branchValueRequired" }] : [];
  }
  return validateRuleNode(ownFieldId, branch, availableFields, path, depth);
}

function validateRuleNode(
  ownFieldId: string,
  node: ConditionalRuleNode,
  availableFields: SectionFormField[],
  path: string,
  depth: number,
): CalculationConfigError[] {
  if (depth > MAX_CALCULATION_DEPTH) {
    return [{ path, code: "nestingTooDeep" }];
  }

  const errors: CalculationConfigError[] = [];
  const conditions = node.if ?? [];
  if (conditions.length === 0) {
    errors.push({ path: `${path}.if`, code: "emptyConditions" });
  } else if (
    validateFieldDependencyConditions(ownFieldId, conditions, availableFields, { allowDuplicates: true }).length > 0
  ) {
    // Un mismo field_id repetido es válido acá (ver validateFieldDependencyConditions);
    // cualquier otro problema (target inexistente, operador inválido, valor faltante) se
    // agrupa en un único código — el detalle por condición lo muestra el propio editor
    // (ver FormFieldConditionsEditor + errors prop en SectionConditionalRuleEditor).
    errors.push({ path: `${path}.if`, code: "invalidCondition" });
  }

  errors.push(...validateBranch(ownFieldId, node.then, availableFields, `${path}.then`, depth + 1));
  errors.push(...validateBranch(ownFieldId, node.else, availableFields, `${path}.else`, depth + 1));

  return errors;
}

export function validateCalculationConfig(
  field: Pick<SectionFormField, "field_id" | "question_type" | "data_type" | "calculation_config">,
  availableFields: SectionFormField[],
): CalculationConfigError[] {
  const calculated = isCalculatedField(field);
  const config = field.calculation_config;

  if (!calculated) {
    return config ? [{ path: "calculation_config", code: "configNotAllowed" }] : [];
  }
  if (!config) {
    return [{ path: "calculation_config", code: "missingConfig" }];
  }

  if (field.question_type === FORMULA_QUESTION_TYPE) {
    if (config.mode !== "formula") return [{ path: "calculation_config.mode", code: "modeMismatch" }];
    return validateFormula(field.field_id, config, availableFields);
  }

  if (field.question_type === CONDITIONAL_QUESTION_TYPE) {
    if (config.mode !== "conditional") return [{ path: "calculation_config.mode", code: "modeMismatch" }];
    return validateRuleNode(field.field_id, config.root, availableFields, "root", 1);
  }

  return [];
}

// true si TODOS los campos calculados de la sección tienen calculation_config válido (y
// ningún campo no-calculado lleva uno). `earlierSectionsFields` son las preguntas de
// secciones con order menor (siempre disponibles) — mismo patrón que
// formFieldsHaveValidDependencies.
export function formFieldsHaveValidCalculations(
  fields: SectionFormField[],
  earlierSectionsFields: SectionFormField[],
): boolean {
  return fields.every((field, index) => {
    const availableFields = [...fields.slice(0, index), ...earlierSectionsFields];
    return validateCalculationConfig(field, availableFields).length === 0;
  });
}
