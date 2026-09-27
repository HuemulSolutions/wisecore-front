import type { TFunction } from 'i18next';

// El backend calcula can_generate/cannot_generate_reason en GET /documents/{id}
// y GET /documents/{id}/content. Hoy hay dos causas conocidas, evaluadas en
// orden por el backend (solo devuelve una a la vez):
//   1. context_required=true y el documento no tiene ningún contexto/dependencia
//      configurado (motivo "genérico", CONTEXT_REQUIRED_RE).
//   2. algún contexto individual con required=true sin contenido cargado,
//      independiente de context_required (motivo "por ítem", REQUIRED_ITEMS_RE,
//      lista los nombres de los contextos faltantes).
// A futuro puede haber otras causas sin que cambie la forma de estos campos —
// por eso un motivo no reconocido cae al string crudo del backend en vez de
// un mensaje genérico que oculte la causa.
//
// Si el backend llega a exponer un código estable (`cannot_generate_code`) en
// vez de solo prosa, cambiar estas regex por ese código.
const CONTEXT_REQUIRED_RE = /requires\s+context\s+to\s+start\s+ai\s+generation/i;
const REQUIRED_ITEMS_RE = /required\s+context\s+items\s+must\s+be\s+filled\s+in/i;

export function isMissingContextReason(rawReason?: string | null): boolean {
  return typeof rawReason === 'string' && CONTEXT_REQUIRED_RE.test(rawReason);
}

export function isMissingRequiredContextItemsReason(rawReason?: string | null): boolean {
  return typeof rawReason === 'string' && REQUIRED_ITEMS_RE.test(rawReason);
}

/** Cualquiera de los dos motivos relacionados a contexto: habilita el CTA "Configurar contexto". */
export function isContextRelatedReason(rawReason?: string | null): boolean {
  return isMissingContextReason(rawReason) || isMissingRequiredContextItemsReason(rawReason);
}

/**
 * Extrae los nombres de contexto listados al final del motivo "por ítem"
 * (después de los dos puntos, separados por coma). [] si no matchea o no se
 * puede parsear — el caller debe degradar al string crudo en ese caso.
 */
export function extractMissingContextItemNames(rawReason?: string | null): string[] {
  if (!isMissingRequiredContextItemsReason(rawReason)) return [];
  const afterColon = rawReason!.split(':').slice(1).join(':').trim();
  if (!afterColon) return [];
  return afterColon
    .replace(/\.$/, '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
}

/**
 * Traduce `cannot_generate_reason` del backend a texto de UI.
 * Solo debe llamarse cuando `can_generate === false`.
 */
export function resolveCannotGenerateReason(
  rawReason: string | null | undefined,
  t: TFunction,
): string {
  if (!rawReason) return t('assets:content.cannotGenerateGeneric');
  if (isMissingContextReason(rawReason)) return t('assets:content.cannotGenerateNeedsContext');
  if (isMissingRequiredContextItemsReason(rawReason)) {
    const items = extractMissingContextItemNames(rawReason);
    if (items.length > 0) {
      return t('assets:content.cannotGenerateMissingRequiredContext', { items: items.join(', ') });
    }
    return t('assets:content.cannotGenerateMissingRequiredContextGeneric');
  }
  return rawReason;
}
