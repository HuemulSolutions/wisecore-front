import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/organization-context';
import { getDocumentSections } from '@/services/assets';
import type { ContentSection } from '@/types/assets';

/**
 * Permiso por sección resuelto por el backend, leído de `GET /documents/{id}/sections`
 * (única fuente que hoy trae `view`/`can_edit` — `GET /documents/{id}/content`, que es
 * lo que renderiza `/asset` y el wizard, NO manda estos campos). El backend ya omite
 * de esa lista las secciones sin `view` para el usuario actual.
 *
 * Ver "ia context/permisos-seccion-lifecycle-guide.md" para el árbol de decisión
 * completo (org admin → flag del template → sin filas → con filas).
 */
export interface SectionAccessMap {
  /** `null` = lista no disponible (query en error) → no restringir (fail-open). */
  allowedIds: Set<string> | null;
  /** Solo contiene entradas con `can_edit` explícito (`true`/`false`); `null`/ausente no se guarda. */
  canEditById: Map<string, boolean>;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useDocumentSectionAccess(
  documentId?: string,
  enabled: boolean = true,
): SectionAccessMap {
  const { selectedOrganizationId } = useOrganization();
  const queryEnabled = enabled && !!documentId && !!selectedOrganizationId;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['document-section-access', documentId],
    queryFn: () => getDocumentSections(documentId!, selectedOrganizationId!),
    enabled: queryEnabled,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  return useMemo<SectionAccessMap>(() => {
    if (isError || !data) {
      return { allowedIds: null, canEditById: new Map(), isLoading, isError, refetch };
    }
    const allowedIds = new Set<string>();
    const canEditById = new Map<string, boolean>();
    for (const item of data) {
      allowedIds.add(item.id);
      if (item.can_edit === true || item.can_edit === false) {
        canEditById.set(item.id, item.can_edit);
      }
    }
    return { allowedIds, canEditById, isLoading, isError, refetch };
  }, [data, isError, isLoading, refetch]);
}

/**
 * Invalida la query de `useDocumentSectionAccess` para un documento — llamar junto a
 * la invalidación de `['document-content', documentId]` cada vez que cambie la
 * composición de secciones o sus reglas de acceso (crear/editar/borrar/reordenar
 * sección, guardar la matriz de acceso del template).
 */
export function useInvalidateDocumentSectionAccess() {
  const queryClient = useQueryClient();
  return (documentId?: string) => {
    if (!documentId) return;
    queryClient.invalidateQueries({ queryKey: ['document-section-access', documentId] });
  };
}

/**
 * ¿Se renderiza esta sección de `/content`? Fail-open si la lista de acceso no está
 * disponible (`allowedIds === null`, ej. la query falló) o si la sección no trae
 * `section_id` (secciones sin definición propia no pasan por este control).
 */
export function canViewSection(section: ContentSection, access: SectionAccessMap): boolean {
  if (access.allowedIds === null) return true;
  if (!section.section_id) return true;
  return access.allowedIds.has(section.section_id);
}

/**
 * Permiso de edición resuelto para esta sección: `false` bloquea la edición,
 * `null` deja que decida el permiso del documento completo (el flag no aplica a
 * esta sección, o la lista de acceso no está disponible). Prioridad: el mapa
 * resuelto por `useDocumentSectionAccess` sobre `section.can_edit` (hoy siempre
 * `undefined` porque `/content` no lo manda — se deja como refuerzo a futuro).
 */
export function resolveSectionCanEdit(
  section: ContentSection,
  access: SectionAccessMap,
): boolean | null {
  if (section.section_id && access.canEditById.has(section.section_id)) {
    return access.canEditById.get(section.section_id)!;
  }
  return section.can_edit ?? null;
}
