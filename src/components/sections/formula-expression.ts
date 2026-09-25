import type {
  FormulaCalculationConfig,
  LegacyFormulaCalculationConfig,
  SectionFormField,
} from "@/types/sections/core";

// Utilidades puras de campo_calculado_formula (ver "ia context/campos-calculados-en-formularios-guide.md").
// El front NUNCA evalúa la expresión: solo la arma, valida referencias y la describe.

const TOKEN_SOURCE = "@([\\p{L}\\p{N}_]+)";

/** Regex nuevo por llamada: las regex globales guardan `lastIndex` entre usos. */
export const createFormulaTokenRegex = () => new RegExp(TOKEN_SOURCE, "gu");

/** field_id únicos referenciados con `@`, en orden de aparición (es lo que va en `fields`). */
export function extractFormulaFieldIds(expression: string): string[] {
  const ids: string[] = [];
  for (const match of expression.matchAll(createFormulaTokenRegex())) {
    if (!ids.includes(match[1])) ids.push(match[1]);
  }
  return ids;
}

/** Arma la config desde el texto: `fields` siempre queda consistente con `expression`. */
export function buildFormulaConfig(
  expression: string,
  roundDecimals: number | null | undefined,
): FormulaCalculationConfig {
  return {
    mode: "formula",
    expression,
    fields: extractFormulaFieldIds(expression),
    round_decimals: roundDecimals ?? null,
  };
}

export const EMPTY_FORMULA_CONFIG: FormulaCalculationConfig = buildFormulaConfig("", 2);

type AnyFormulaConfig = FormulaCalculationConfig | LegacyFormulaCalculationConfig;

function isLegacyFormulaConfig(config: AnyFormulaConfig): config is LegacyFormulaCalculationConfig {
  return !("expression" in config) && Array.isArray((config as LegacyFormulaCalculationConfig).terms);
}

// terms[]/constant → expresión: "@subtotal + @subtotal * 0.19 - 5".
function legacyTermsToExpression(config: LegacyFormulaCalculationConfig): string {
  let expression = "";
  (config.terms ?? [])
    .filter((term) => term.field_id)
    .forEach((term) => {
      const negative = term.operator === "subtract";
      const multiplier = term.multiplier ?? 1;
      const operand = multiplier === 1 ? `@${term.field_id}` : `@${term.field_id} * ${multiplier}`;
      expression += expression ? ` ${negative ? "-" : "+"} ${operand}` : `${negative ? "-" : ""}${operand}`;
    });

  const constant = config.constant ?? 0;
  if (constant !== 0) {
    expression += expression
      ? ` ${constant > 0 ? "+" : "-"} ${Math.abs(constant)}`
      : String(constant);
  }
  return expression;
}

/** Acepta el formato nuevo o el legado (terms[]) y devuelve siempre el nuevo. */
export function normalizeFormulaConfig(config: AnyFormulaConfig | null | undefined): FormulaCalculationConfig {
  if (!config) return EMPTY_FORMULA_CONFIG;
  if (isLegacyFormulaConfig(config)) {
    return buildFormulaConfig(legacyTermsToExpression(config), config.round_decimals);
  }
  return {
    mode: "formula",
    expression: config.expression ?? "",
    fields: config.fields ?? extractFormulaFieldIds(config.expression ?? ""),
    round_decimals: config.round_decimals ?? null,
  };
}

/** Resumen legible: cada `@id` se reemplaza por el field_name de la pregunta si se conoce. */
export function renderFormulaPreview(expression: string, fields: SectionFormField[]): string {
  return expression.replace(createFormulaTokenRegex(), (_match, id: string) => {
    const name = fields.find((f) => f.field_id === id)?.field_name;
    return name ? `[${name}]` : `@${id}`;
  });
}

/** Chequeo grueso de paréntesis; la sintaxis completa la valida el backend (400). */
export function hasBalancedParentheses(expression: string): boolean {
  let depth = 0;
  for (const char of expression) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}
