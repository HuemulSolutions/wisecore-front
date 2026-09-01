import type { QueryClient } from '@tanstack/react-query';
import { computeSectionStats } from '@/components/workflow/workflow-section-stats';
import type { ContentSection } from '@/types/assets';
import type { FormValuesSectionPayload } from '@/types/sections/core';
import type { ReviewStatus } from '@/types/section-execution';

type DocumentContentCache = { content?: ContentSection[] } | undefined;

// Los parches optimistas NO son data fresca del servidor: si dejan que TanStack selle
// `dataUpdatedAt = Date.now()` (comportamiento por defecto de setQueryData/setQueriesData
// sin `updatedAt` explícito), useReconcileFormReviewStatus los confunde con un /content
// real y reconcilia contra un `lifecycle_status.advance_blockers` que ningún parche de
// acá actualiza — degradando a 'editing' una sección recién marcada 'finished'. Por eso
// cada parche de este archivo preserva el `dataUpdatedAt` que la query ya tenía en vez
// de dejar que se renueve. Se itera con setQueryData (no setQueriesData) porque cada
// query cacheada bajo el mismo prefijo (['document-content', id] y
// ['document-content', id, execId] pueden coexistir) tiene su propio dataUpdatedAt a
// preservar — un solo `updatedAt` para todas sería incorrecto. Ver
// src/hooks/useReconcileFormReviewStatus.ts para el otro lado de este invariante.
function patchContentQueries(
  queryClient: QueryClient,
  documentId: string,
  updater: (old: DocumentContentCache) => DocumentContentCache,
): void {
  for (const query of queryClient.getQueryCache().findAll({ queryKey: ['document-content', documentId] })) {
    if (query.state.data === undefined) continue;
    queryClient.setQueryData(query.queryKey, updater, { updatedAt: query.state.dataUpdatedAt });
  }
}

// Aplica el payload de PATCH /section_executions/{id}/form_values al caché de
// ['document-content', documentId], sin refetch — mismo patrón en assets-content.tsx
// y workflow-detail-panel.tsx. Si alguna sección del payload no está en el caché
// (recién pasó a "aplicar": una respuesta hizo visibles sus preguntas y el backend
// ya no la traía en /content hasta ahora), no hay forma de insertarla completa con
// los datos del payload (falta order/section_id/status) — se invalida /content en
// vez de parchear, para traer la sección completa en el próximo fetch.
export function applyFormValuesPatch(
  queryClient: QueryClient,
  documentId: string,
  payload: FormValuesSectionPayload[],
): void {
  const queryKey = { queryKey: ['document-content', documentId] };
  const cachedIds = new Set<string>();
  // field_id referenciados por el depends_on de alguna SECCIÓN cacheada (de cualquier
  // tipo). A diferencia de los triggers a nivel de pregunta, PATCH /form_values NUNCA
  // recalcula ni devuelve los flags de sección (is_visible/can_answer) — si el PATCH
  // tocó uno de estos ids, la visibilidad de otra sección pudo cambiar sin que este
  // payload lo refleje, así que hay que refetch en vez de parchear. Ver
  // "ia context/dependencias-condicionales-formularios-guide.md" §3.2.
  const sectionTriggerIds = new Set<string>();
  for (const [, data] of queryClient.getQueriesData<{ content?: ContentSection[] }>(queryKey)) {
    for (const section of data?.content ?? []) {
      cachedIds.add(section.id);
      for (const cond of section.depends_on ?? []) sectionTriggerIds.add(cond.field_id);
    }
  }

  const hasUnknownSection = payload.some((p) => !cachedIds.has(p.section_execution_id));
  const touchedSectionTrigger = payload.some((p) =>
    p.form_fields.some((f) => f.field_id && sectionTriggerIds.has(f.field_id)),
  );
  if (hasUnknownSection || touchedSectionTrigger) {
    queryClient.invalidateQueries(queryKey);
    return;
  }

  const groupsBySectionId = new Map(payload.map((p) => [p.section_execution_id, p]));

  // `PATCH /form_values` tampoco devuelve `lifecycle_status`: `can_advance` y
  // `advance_blockers` (respuestas obligatorias pendientes) quedarían con el valor del
  // último GET /content, y el botón "Completar" seguiría deshabilitado después de
  // responder el último obligatorio hasta que el usuario apretara refresh. Se detecta
  // el cruce del umbral "esta sección tiene obligatorios pendientes" (0 ↔ >0, en ambas
  // direcciones) y solo entonces se refetchea. No se refetchea por cada respuesta: pasar
  // de 3 a 2 pendientes no cambia `can_advance`, solo el conteo del diálogo de blockers,
  // y sería un GET /content por campo respondido. El backend sigue siendo la única
  // autoridad — acá no se recalculan blockers en el cliente, solo se decide cuándo pedirlos.
  let crossedRequiredThreshold = false;
  for (const [, data] of queryClient.getQueriesData<{ content?: ContentSection[] }>(queryKey)) {
    for (const section of data?.content ?? []) {
      const group = groupsBySectionId.get(section.id);
      if (!group) continue;
      const prev = computeSectionStats(section);
      const next = computeSectionStats({ ...section, form_fields: group.form_fields });
      if ((prev.missingRequired === 0) !== (next.missingRequired === 0)) {
        crossedRequiredThreshold = true;
        break;
      }
    }
    if (crossedRequiredThreshold) break;
  }

  patchContentQueries(queryClient, documentId, (old) => {
    if (!old?.content || !Array.isArray(old.content)) return old;
    return {
      ...old,
      content: old.content.map((s) => {
        const group = groupsBySectionId.get(s.id);
        if (!group) return s;
        return { ...s, form_fields: group.form_fields, section_name: group.section_name ?? s.section_name };
      }),
    };
  });

  // Después del parche optimista, nunca antes: `invalidateQueries` no borra la data
  // cacheada (solo la marca stale y refetchea las queries activas), así que la UI sigue
  // mostrando las respuestas recién guardadas mientras llega el /content con el
  // `lifecycle_status` recalculado.
  if (crossedRequiredThreshold) {
    queryClient.invalidateQueries(queryKey);
  }
}

// Parchea review_status de una sola sección en el caché de ['document-content', documentId],
// sin refetch. Usado tras el PATCH /review_status del autoguardado (asset-form-section.tsx,
// assets-section.tsx) y de la reconciliación contra advance_blockers (useReconcileFormReviewStatus).
export function applyReviewStatusPatch(
  queryClient: QueryClient,
  documentId: string,
  sectionExecutionId: string,
  status: ReviewStatus,
): void {
  patchContentQueries(queryClient, documentId, (old) => {
    if (!old?.content || !Array.isArray(old.content)) return old;
    return {
      ...old,
      content: old.content.map((s) => (s.id === sectionExecutionId ? { ...s, review_status: status } : s)),
    };
  });
}
