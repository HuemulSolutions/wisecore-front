import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { logger } from "@/lib/logger";
import { isSectionPermissionDeniedError } from "@/lib/section-permission-errors";
import { updateReviewStatus } from "@/services/section_execution";
import { applyReviewStatusPatch } from "@/components/assets/content/utils/patch-document-content";
import { getAdvanceBlockers } from "@/lib/advance-blockers-utils";
import { resolveSectionCanEdit, type SectionAccessMap } from "@/hooks/useDocumentSectionAccess";
import type { ContentSection, LifecycleStatus } from "@/types/assets";

interface UseReconcileFormReviewStatusParams {
  documentId?: string | null;
  organizationId?: string;
  /** `data?.content` de GET /documents/{id}/content, sin filtrar. */
  sections?: ContentSection[];
  lifecycleStatus?: LifecycleStatus;
  sectionAccess: SectionAccessMap;
  /** Permiso de escritura efectivo (RBAC × lifecycle × etapa) — en solo lectura el hook no escribe nada. */
  enabled: boolean;
  /**
   * `dataUpdatedAt` del `useQuery` de `/content` (no confundir con un timestamp propio).
   * Es la señal que dispara la reconciliación — ver docblock del hook: solo cambia
   * cuando el `queryFn` resuelve un fetch real, porque los parches optimistas de
   * `patch-document-content.ts` preservan explícitamente el `dataUpdatedAt` previo
   * (no es un comportamiento espontáneo de TanStack Query — por defecto SÍ lo renueva).
   */
  dataUpdatedAt: number;
  /**
   * `isFetching` del mismo `useQuery`. Con un fetch en vuelo, `sections`/`lifecycleStatus`
   * en caché pueden venir de ANTES de un parche optimista reciente (finished + blockers
   * viejos) — correr la reconciliación ahí degradaría una sección recién completada. El
   * fetch que está en curso va a traer `advance_blockers` consistentes y re-disparar este
   * efecto solo (vía `dataUpdatedAt`).
   */
  isFetching: boolean;
}

/**
 * Corrige falsos "Respondido": una sección form que quedó en review_status='finished'
 * pero que el backend SÍ lista con obligatorios pendientes en
 * `lifecycle_status.advance_blockers` (código REQUIRED_ANSWERS_PENDING) vuelve a
 * 'editing'. Corre solo cuando llega un /content REALMENTE fresco — carga inicial,
 * refresh manual, o la invalidación que `applyFormValuesPatch` ya dispara al cruzar el
 * umbral de obligatorios pendientes — nunca en un parche optimista propio.
 *
 * Deliberadamente ASIMÉTRICO — solo degrada, nunca promueve a 'finished'. La ausencia
 * de una sección en `advance_blockers` NO significa "completa": una sección cuyos
 * obligatorios están todos inactivos por `depends_on` (is_visible/can_answer false)
 * tampoco bloquea el avance y por eso no aparece en la lista, pero el usuario puede no
 * haberla abierto nunca. Promover esas secciones fue justamente el bug que motivó esta
 * regla — ver "review_status" en el historial de este hook. Promover a 'finished' es
 * responsabilidad exclusiva del autoguardado real (asset-form-section.tsx →
 * syncReviewStatus), que solo actúa sobre la sección que el usuario efectivamente edita.
 *
 * `sections`/`lifecycleStatus` llegan del mismo objeto `data` de un `useQuery` que
 * capa 1 también parchea de forma optimista (`applyReviewStatusPatch`, solo toca
 * `review_status`; `applyFormValuesPatch`, solo toca `form_fields`) — esos parches
 * SIEMPRE dejan `lifecycle_status.advance_blockers` desactualizado un instante,
 * porque ninguno lo toca. Si este hook reaccionara a cualquier cambio de referencia
 * de `sections`/`lifecycleStatus`, se dispararía sobre esa inconsistencia transitoria
 * (review_status ya en 'finished', advance_blockers todavía viejo) y revertiría un
 * estado recién confirmado por el propio autoguardado. Por eso el efecto dispara con
 * `dataUpdatedAt` y lee `sections`/`lifecycleStatus` desde refs, no desde las
 * dependencias del efecto — y por eso mismo `patch-document-content.ts` preserva el
 * `dataUpdatedAt` original en cada parche optimista: es lo que garantiza que
 * `dataUpdatedAt` solo cambie en un fetch real. Ese invariante cruza dos archivos; si
 * se rompe en uno, este hook vuelve a reconciliar contra datos transitorios. `isFetching`
 * es una segunda guarda para la ventana entre "el parche ya escribió `finished`" y "el
 * refetch que dispara todavía no resolvió" — p.ej. si el efecto corre al montar (remount
 * del panel) mientras ese fetch sigue en curso.
 */
export function useReconcileFormReviewStatus({
  documentId,
  organizationId,
  sections,
  lifecycleStatus,
  sectionAccess,
  enabled,
  dataUpdatedAt,
  isFetching,
}: UseReconcileFormReviewStatusParams): void {
  const queryClient = useQueryClient();
  // Evita reenviar el mismo PATCH mientras está en vuelo, y no reintentar una sección
  // que ya devolvió 403 de permiso (queda para el próximo fetch legítimo, no para
  // cada render de este hook). Claves = section_execution_id, únicas por servidor —
  // no hace falta resetear al cambiar de documento.
  const inFlightRef = useRef<Set<string>>(new Set());
  const deniedRef = useRef<Set<string>>(new Set());

  // Última data conocida, actualizada en cada render sin condicionar nada. Cuando el
  // efecto de abajo corre (porque dataUpdatedAt cambió), estos refs ya reflejan los
  // valores del mismo commit que trajo ese dataUpdatedAt — consistentes entre sí,
  // porque ambos vienen del mismo GET /content.
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;
  const lifecycleStatusRef = useRef(lifecycleStatus);
  lifecycleStatusRef.current = lifecycleStatus;

  useEffect(() => {
    const sections = sectionsRef.current;
    const lifecycleStatus = lifecycleStatusRef.current;
    if (!enabled || !documentId || !organizationId || !sections?.length) return;
    // Con un fetch en vuelo, lo cacheado puede ser anterior a un parche optimista
    // reciente (finished + advance_blockers todavía viejos) — ver docblock arriba.
    if (isFetching) return;

    const blockedIds = new Set(
      getAdvanceBlockers(lifecycleStatus)
        .filter((b) => b.code === "REQUIRED_ANSWERS_PENDING")
        .map((b) => b.section_execution_id),
    );
    if (blockedIds.size === 0) return;

    for (const section of sections) {
      if (section.section_type !== "form") continue;
      if (section.review_status !== "finished") continue;
      if (!blockedIds.has(section.id)) continue;
      if (resolveSectionCanEdit(section, sectionAccess) === false) continue;
      if (deniedRef.current.has(section.id) || inFlightRef.current.has(section.id)) continue;

      inFlightRef.current.add(section.id);
      updateReviewStatus(section.id, "editing", organizationId)
        .then(() => {
          applyReviewStatusPatch(queryClient, documentId, section.id, "editing");
        })
        .catch((error) => {
          // Silencioso: es una reconciliación de fondo, no una acción del usuario.
          logger.warn("[useReconcileFormReviewStatus] No se pudo sincronizar review_status", error);
          if (isSectionPermissionDeniedError(error)) deniedRef.current.add(section.id);
        })
        .finally(() => {
          inFlightRef.current.delete(section.id);
        });
    }
    // sections/lifecycleStatus se leen de refs (no del closure) a propósito — así el
    // linter no los exige acá. Si estuvieran en este array, el efecto correría en cada
    // parche optimista de capa 1 (que cambia la referencia de `data` sin que llegue un
    // /content real), reintroduciendo la carrera documentada arriba. dataUpdatedAt es
    // la única señal de "esto es un fetch real".
  }, [enabled, documentId, organizationId, sectionAccess, queryClient, dataUpdatedAt, isFetching]);
}
