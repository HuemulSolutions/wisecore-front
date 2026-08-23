import type { TFunction } from 'i18next';

// El backend calcula can_generate/cannot_generate_reason en GET /documents/{id}
// y GET /documents/{id}/content. Hoy la única causa conocida es context_required
// sin contexto ni dependencias configuradas; a futuro puede haber otras causas
// sin que cambie la forma de estos campos — por eso un motivo no reconocido cae
// al string crudo del backend en vez de un mensaje genérico que oculte la causa.
//
// Si el backend llega a exponer un código estable (`cannot_generate_code`) en
// vez de solo prosa, cambiar esta regex por ese código.
const CONTEXT_REQUIRED_RE = /requires\s+context\s+to\s+start\s+ai\s+generation/i;

export function isMissingContextReason(rawReason?: string | null): boolean {
  return typeof rawReason === 'string' && CONTEXT_REQUIRED_RE.test(rawReason);
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
  return rawReason;
}
