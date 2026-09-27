import type { TFunction } from "i18next";
import type { ContentSection } from "@/types/assets";
import type { FieldDependencyCondition, FormFieldValue } from "@/types/sections/core";

const VALUELESS_OPERATORS = new Set(["is_empty", "is_not_empty"]);

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "number") return value.toLocaleString();
  return String(value ?? "");
}

function describeCondition(
  cond: FieldDependencyCondition,
  allFields: FormFieldValue[],
  t: TFunction,
): string | null {
  const target = allFields.find((f) => f.field_id === cond.field_id);
  if (!target) return null;
  const operator = t(`section.dependency.operators.${cond.operator}`);
  const name = `«${target.field_name}»`;
  return VALUELESS_OPERATORS.has(cond.operator)
    ? `${name} ${operator}`
    : `${name} ${operator} ${formatValue(cond.value)}`;
}

/**
 * Frase que explica por qué una sección está inactiva, redactada desde su `depends_on`
 * (ej. «Se activa cuando «Monto estimado» supera 200.000.»). Solo DESCRIBE la regla: el front nunca
 * la evalúa, `is_visible`/`can_answer` los calcula el backend (mismo criterio que
 * describeCalculationConfig). `allFields` debe abarcar TODAS las secciones del documento: el
 * target de la condición casi siempre vive en otra sección. Sin `depends_on` devuelve null; si un
 * `field_id` no resuelve cae al texto genérico, nunca muestra el id crudo.
 */
export function describeSectionDependency(
  section: Pick<ContentSection, "depends_on">,
  allFields: FormFieldValue[],
  t: TFunction,
): string | null {
  const conditions = section.depends_on;
  if (!conditions?.length) return null;

  const parts = conditions.map((c) => describeCondition(c, allFields, t));
  if (parts.some((p) => p === null)) return t("section.dependency.unknown");

  return t("section.dependency.prefix", { condition: parts.join(t("section.dependency.and")) });
}
