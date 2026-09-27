import { useMemo } from "react";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { RBAC_PAGES } from "@/lib/rbac-matrix";
import type { Permission } from "@/lib/jwt-utils";

/**
 * Eje RBAC del panel Wisy (chatbot).
 *
 * Wisy no es una ruta sino chrome global montado en `app-layout.tsx`, así que
 * no tiene entrada en `RBAC_PAGES` (`RbacPageSpec` exige `route`). Tampoco
 * existe un recurso `chatbot`/`conversation` en `PermissionResource`: por el
 * mismo criterio que `/search` (`GET /search/` devuelve documentos, así que se
 * gatea con `asset:l|r`), el panel se gatea con la lectura del recurso que
 * realmente sirve — conversa sobre assets y ejecuciones, y su contexto de
 * trabajo son ids de documento/ejecución.
 *
 * Eje único a propósito: las conversaciones son del propio usuario y no mutan
 * nada de la organización, así que separar un `asset:u` para renombrar/archivar
 * dejaría a un rol de solo lectura creando hilos que después no puede
 * gestionar. Ver ia context/rbac-audit-guide.md (18ª pasada).
 *
 * Se resuelve con un hook y no con props desde el punto de montaje porque
 * `WisyToggle` guarda el elemento `<WisyPanel />` dentro del estado del
 * `GlobalPanelProvider` al momento del clic: una prop calculada ahí quedaría
 * congelada con los permisos que había en ese instante.
 */
export function useWisyAccess() {
  const { hasAnyPermission, isLoading } = useUserPermissions();

  const canUseWisy = useMemo(
    () => hasAnyPermission([...RBAC_PAGES.asset.routePermissions] as Permission[]),
    [hasAnyPermission]
  );

  return { canUseWisy, isLoading };
}
