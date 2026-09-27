import type { FormulaCalculationConfig, SectionFormField } from "@/types/sections/core";

// Resumen de una línea del resultado de campo_calculado_formula, ej.
// "+ Subtotal × 1 + Subtotal × 0,19". En archivo propio (no .tsx) para que ni
// section-formula-terms-editor.tsx ni describe-calculation-config.ts mezclen un export de
// función con un export de componente (rompe React Fast Refresh).
export function buildFormulaPreview(config: FormulaCalculationConfig, fields: SectionFormField[]): string {
  const labelFor = (fieldId: string) => fields.find((f) => f.field_id === fieldId)?.field_name || fieldId;
  const parts = (config.terms ?? [])
    .filter((term) => term.field_id)
    .map((term) => {
      const sign = term.operator === "subtract" ? "−" : "+";
      const multiplier = term.multiplier ?? 1;
      return `${sign} ${labelFor(term.field_id)} × ${multiplier}`;
    });
  const constant = config.constant ?? 0;
  if (constant !== 0) parts.push(`${constant >= 0 ? "+" : "−"} ${Math.abs(constant)}`);
  return parts.join(" ").replace(/^\+ /, "");
}
