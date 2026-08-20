import { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useOrganization } from '@/contexts/organization-context';
import { rbacQueryKeys } from '@/hooks/useRbac';
import { getRoles } from '@/services/rbac';
import type { Role } from '@/types/rbac';
import type { RoleReferenceElement } from '@/types/reference';

/** page_size grande para traer TODOS los roles de una vez — mismo truco ya usado
 * en roles-create-sheet.tsx/roles-edit-sheet.tsx para resolver el combobox de rol padre. */
const ALL_ROLES_PAGE_SIZE = 1000;

/**
 * Trae todos los roles de la organización en una sola llamada y los indexa por id.
 * No existe un endpoint de "roles por id" — este es el único camino para resolver
 * el nombre de un rol padre (`parent_role_id`) o los datos frescos de un
 * `role_reference` ya insertado sin un fetch por id.
 */
export function useRolesMap(enabled: boolean) {
  const { selectedOrganizationId } = useOrganization();

  const query = useQuery({
    queryKey: [...rbacQueryKeys.roles(selectedOrganizationId), 'all', ALL_ROLES_PAGE_SIZE],
    queryFn: () => getRoles(1, ALL_ROLES_PAGE_SIZE),
    enabled: enabled && !!selectedOrganizationId,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  });

  const byId = useMemo(() => {
    const map: Record<string, Role> = {};
    for (const role of query.data?.data ?? []) map[role.id] = role;
    return map;
  }, [query.data]);

  return { byId, isLoaded: query.isSuccess, isLoading: query.isLoading };
}

interface RoleRefsContextValue {
  byId: Record<string, Role>;
  isLoaded: boolean;
}

const RoleRefsContext = createContext<RoleRefsContextValue>({ byId: {}, isLoaded: false });

/** Monta `useRolesMap` una vez para todo el documento — resuelve tanto chips
 * `role_reference` frescas como el nombre del rol padre en el combobox. */
export function RoleRefsProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const { byId, isLoaded } = useRolesMap(enabled);
  // isLoaded solo cuando el fetch realmente corrió: con `enabled=false` (el documento
  // persistido todavía no tiene ninguna role_reference) el mapa nunca se pide, y una
  // referencia recién tipeada (aún sin guardar) no debe caer en "no existe" — debe
  // quedarse en su snapshot hasta que el próximo render habilite el fetch.
  const value = useMemo(() => ({ byId, isLoaded: enabled && isLoaded }), [byId, isLoaded, enabled]);
  return <RoleRefsContext.Provider value={value}>{children}</RoleRefsContext.Provider>;
}

export interface ResolvedRoleReference {
  name: string;
  color?: string | null;
  description: string;
  usersCount?: number;
  permissionCount?: number;
  parentName: string | null;
  isPosition: boolean;
  isMissing: boolean;
}

export function useResolvedRoleReference(element: RoleReferenceElement): ResolvedRoleReference {
  const { byId, isLoaded } = useContext(RoleRefsContext);

  return useMemo(() => {
    const snapshot: ResolvedRoleReference = {
      name: element.name ?? '',
      color: element.color,
      description: '',
      parentName: null,
      isPosition: false,
      isMissing: false,
    };

    if (!isLoaded) return snapshot;

    const role = byId[element.roleId];
    if (!role) return { ...snapshot, isMissing: true };

    const parent = role.parent_role_id ? byId[role.parent_role_id] : undefined;

    return {
      name: role.name,
      color: role.color ?? element.color,
      description: role.description ?? '',
      usersCount: role.users_count,
      permissionCount: role.permission_num ?? role.permissions?.length,
      parentName: parent?.name ?? null,
      isPosition: !!role.is_position,
      isMissing: false,
    };
  }, [byId, isLoaded, element.roleId, element.name, element.color]);
}
