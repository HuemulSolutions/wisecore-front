import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getLibraryContent } from '@/services/folders';
import { useRoles } from '@/hooks/useRbac';
import { usePageAccess } from '@/hooks/usePageAccess';
import type { LibraryContentAsset } from '@/types/folders';
import type { Role } from '@/types/rbac';

const DEBOUNCE_MS = 250;
const PAGE_SIZE = 20;

export const mentionSearchQueryKeys = {
  all: ['mention-search'] as const,
  assets: (organizationId: string, term: string) =>
    [...mentionSearchQueryKeys.all, 'assets', organizationId, term] as const,
};

/**
 * Datos del dropdown inline de mención (`@`): documentos (con sus versiones,
 * vía include_executions) y roles, filtrados server-side por el mismo término
 * de búsqueda. El término se debounce acá para no disparar un request por tecla.
 */
export function useMentionSearch(organizationId: string | undefined, rawTerm: string, assetsEnabled: boolean = true) {
  const [term, setTerm] = useState(rawTerm);

  useEffect(() => {
    const timer = setTimeout(() => setTerm(rawTerm), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [rawTerm]);

  // Mismo predicado (OR) que ya usa el árbol de conocimiento para este mismo
  // endpoint (`GET /folder/{id}/get_content` exige `asset:l|r` Y `folder:l|r`,
  // ver nav-knowledge.tsx) — no duplicar con el AND que usan templates/media,
  // que gatean un uso distinto del mismo endpoint.
  const { can: canAccessAsset } = usePageAccess('asset');
  const canPickAssets = canAccessAsset('listAssets') || canAccessAsset('listFolders');

  const assetsQuery = useQuery({
    queryKey: mentionSearchQueryKeys.assets(organizationId ?? '', term),
    queryFn: () =>
      getLibraryContent(
        organizationId!,
        undefined,
        1,
        PAGE_SIZE,
        term || undefined,
        undefined,
        undefined,
        { includeExecutions: true },
      ),
    // Sin término, la búsqueda global no aporta nada nuevo frente al modo "explorar"
    // carpetas (ver useMentionFolderContent) — evita un fetch redundante al abrir el
    // combobox con el popover en modo browse. `canPickAssets` en falso (rol sin
    // asset:l|r ni folder:l|r — ej. el mismo editor montado desde un formulario de
    // secciones fuera de /asset) también corta el fetch, igual que Roles.
    enabled: canPickAssets && assetsEnabled && !!organizationId,
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  });

  const { can: canAccessRoles } = usePageAccess('roles');
  const canPickRole = canAccessRoles('listRoles');
  const rolesQuery = useRoles(canPickRole, 1, PAGE_SIZE, term);

  const assets: LibraryContentAsset[] = canPickAssets ? (assetsQuery.data?.assets ?? []) : [];
  const roles: Role[] = canPickRole ? (rolesQuery.data?.data ?? []) : [];

  return {
    assets,
    roles,
    canPickAssets,
    canPickRole,
    assetsLoading: canPickAssets && assetsQuery.isLoading,
    rolesLoading: canPickRole && rolesQuery.isLoading,
    isLoading: (canPickAssets && assetsQuery.isLoading) || (canPickRole && rolesQuery.isLoading),
    // `has_next` de cada lista — el backend no manda un total, así que el conteo
    // mostrado en el panel se arma como "cargados" + "+" cuando alguna de las dos
    // listas activas tiene más páginas.
    assetsHasNext: canPickAssets ? (assetsQuery.data?.has_next ?? false) : false,
    rolesHasNext: canPickRole ? (rolesQuery.data?.has_next ?? false) : false,
    // Separados (no un solo `isError` combinado) para que el llamador pueda mostrar
    // el error solo bajo la sección que efectivamente falló — el modo "explorar
    // carpetas" no usa `assetsQuery` (ver useMentionFolderContent) pero los roles
    // siguen viniendo de acá incluso mientras se explora.
    assetsIsError: canPickAssets && assetsQuery.isError,
    rolesIsError: canPickRole && rolesQuery.isError,
    refetchAssets: assetsQuery.refetch,
    refetchRoles: rolesQuery.refetch,
  };
}
