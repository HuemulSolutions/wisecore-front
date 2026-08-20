import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getLibraryContent } from '@/services/folders';
import { useRoles } from '@/hooks/useRbac';
import { usePageAccess } from '@/hooks/usePageAccess';
import type { LibraryContentAsset } from '@/types/folders';
import type { Role } from '@/types/rbac';

const DEBOUNCE_MS = 300;
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
    // combobox con el popover en modo browse.
    enabled: assetsEnabled && !!organizationId,
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  });

  const { can: canAccessRoles } = usePageAccess('roles');
  const canPickRole = canAccessRoles('listRoles');
  const rolesQuery = useRoles(canPickRole, 1, PAGE_SIZE, term);

  const assets: LibraryContentAsset[] = assetsQuery.data?.assets ?? [];
  const roles: Role[] = canPickRole ? (rolesQuery.data?.data ?? []) : [];

  return {
    assets,
    roles,
    canPickRole,
    assetsLoading: assetsQuery.isLoading,
    rolesLoading: canPickRole && rolesQuery.isLoading,
    isLoading: assetsQuery.isLoading || (canPickRole && rolesQuery.isLoading),
  };
}
