import { useCallback, useMemo } from "react";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { RBAC_PAGES, type RbacPageKey } from "@/lib/rbac-matrix";
import type { Permission } from "@/lib/jwt-utils";

/**
 * Deriva accesos de página/feature desde la matriz declarativa `RBAC_PAGES`
 * (ver src/lib/rbac-matrix.ts), en vez de repetir `hasPermission('x:y')` a
 * mano en cada página. El bypass de `isOrgAdmin` ya está aplicado dentro de
 * `hasPermission`/`hasAnyPermission`/`hasAllPermissions` (ver
 * permissions-context.tsx), así que no hay que repetirlo aquí.
 *
 * Uso:
 *   const { canAccessPage, can } = usePageAccess('templates')
 *   if (!canAccessPage) return <HuemulAccessDenied />
 *   can('createTemplate') // boolean, autocompletado sobre las keys de `features`
 */
export function usePageAccess<K extends RbacPageKey>(pageKey: K) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isRootAdmin, isLoading } = useUserPermissions();
  const page = RBAC_PAGES[pageKey];

  const canAccessPage = useMemo(() => {
    if (page.requireRootAdmin) return isRootAdmin;
    if (!page.routePermissions || page.routePermissions.length === 0) return true;
    return hasAnyPermission(page.routePermissions as Permission[]);
  }, [hasAnyPermission, isRootAdmin, page]);

  const can = useCallback(
    (feature: keyof NonNullable<(typeof page)["features"]>): boolean => {
      const features = (page as { features?: Record<string, Permission | Permission[] | { all: Permission[] }> }).features;
      const spec = features?.[feature as string];
      if (!spec) return false;
      if (typeof spec === "string") return hasPermission(spec);
      if (Array.isArray(spec)) return hasAnyPermission(spec);
      return hasAllPermissions(spec.all);
    },
    [hasPermission, hasAnyPermission, hasAllPermissions, page]
  );

  return { canAccessPage, can, isLoading, page };
}
