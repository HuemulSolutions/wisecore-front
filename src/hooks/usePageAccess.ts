import { useCallback, useMemo } from "react";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { RBAC_PAGES, type RbacPageKey, type RbacPageSpec } from "@/lib/rbac-matrix";
import type { Permission } from "@/lib/jwt-utils";

/**
 * Regla de "¿puede ver esta página?" en forma de función pura, para usarla
 * fuera de un componente (p.ej. filtrando una lista de entradas de menú).
 * Es EXACTAMENTE la misma lógica que usa `usePageAccess` — no crear una
 * segunda definición de esta regla en otro archivo (ver
 * ia context/rbac-audit-guide.md sobre helpers que divergen del guard de ruta).
 */
export function resolvePageAccess(
  page: RbacPageSpec,
  ctx: { hasAnyPermission: (ps: Permission[]) => boolean; isRootAdmin: boolean }
): boolean {
  if (page.requireRootAdmin) return ctx.isRootAdmin;
  if (!page.routePermissions || page.routePermissions.length === 0) return true;
  return ctx.hasAnyPermission(page.routePermissions as Permission[]);
}

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

// Cada entrada de RBAC_PAGES es literal (vía `as const`) y solo declara las
// claves que usa (p.ej. "search" no tiene `routePermissions`). Indexar ese
// objeto con un `K` genérico no distribuye sobre la unión de entradas —
// TypeScript exige que la propiedad exista en TODOS los miembros para poder
// acceder a ella directamente. `{ [P in K]: T[P] }[K]` fuerza esa
// distribución y preserva el tipo preciso de `features` por página (necesario
// para el autocompletado de `can`).
type PageOf<K extends RbacPageKey> = { [P in K]: (typeof RBAC_PAGES)[P] }[K];
type FeaturesOf<K extends RbacPageKey> = PageOf<K> extends { features: infer F } ? F : undefined;

export function usePageAccess<K extends RbacPageKey>(pageKey: K) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isRootAdmin, isLoading } = useUserPermissions();
  // Cast a RbacPageSpec (el shape validado por `satisfies` en la matriz) para
  // la lectura en runtime — evita el mismo problema de distribución al leer
  // `requireRootAdmin`/`routePermissions`/`features` de una entrada que no
  // los declara todos.
  const page = RBAC_PAGES[pageKey] as RbacPageSpec;

  const canAccessPage = useMemo(
    () => resolvePageAccess(page, { hasAnyPermission, isRootAdmin }),
    [hasAnyPermission, isRootAdmin, page]
  );

  const can = useCallback(
    (feature: keyof NonNullable<FeaturesOf<K>>): boolean => {
      const spec = page.features?.[feature as string];
      if (!spec) return false;
      if (typeof spec === "string") return hasPermission(spec);
      if (Array.isArray(spec)) return hasAnyPermission(spec);
      return hasAllPermissions(spec.all);
    },
    [hasPermission, hasAnyPermission, hasAllPermissions, page]
  );

  return { canAccessPage, can, isLoading, page };
}
