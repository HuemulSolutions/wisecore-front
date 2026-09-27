import type { TFunction } from "i18next";
import type { ConditionalRuleNode, SectionFormField } from "@/types/sections/core";
import { buildFormulaPreview } from "./formula-preview";

// Cuenta reglas y profundidad máxima de un árbol condicional, para el resumen de una
// línea (no evalúa el árbol — solo lo describe, igual criterio que el resto del front con
// calculation_config: nunca se calcula acá, eso es responsabilidad exclusiva del backend).
function countRules(node: ConditionalRuleNode, depth: number): { rules: number; maxDepth: number } {
  let rules = 1;
  let maxDepth = depth;
  for (const branch of [node.then, node.else]) {
    if (branch.type === "rule") {
      const nested = countRules(branch, depth + 1);
      rules += nested.rules;
      maxDepth = Math.max(maxDepth, nested.maxDepth);
    }
  }
  return { rules, maxDepth };
}

// Resumen de una línea de calculation_config, para la vista de solo lectura de definiciones
// (section-form-fields-view.tsx). "fields" es el conjunto completo de preguntas de la
// sección, para resolver field_name a partir de field_id.
export function describeCalculationConfig(
  field: Pick<SectionFormField, "calculation_config">,
  fields: SectionFormField[],
  t: TFunction,
): string {
  const config = field.calculation_config;
  if (!config) return "";

  if (config.mode === "formula") {
    return buildFormulaPreview(config, fields) || t("sections:form.formFields.calculated.formula.emptyState");
  }

  const { rules, maxDepth } = countRules(config.root, 1);
  return t("sections:form.formFields.calculated.conditional.summary", { rules, depth: maxDepth });
}
