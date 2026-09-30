import { useMemo } from "react";
import { useUserPermissions } from "@/hooks/useUserPermissions";

/**
 * Eje RBAC del panel Wisy (chatbot).
 *
 * Wisy no es una ruta sino chrome global montado en `app-layout.tsx`, así que
 * no tiene entrada en `RBAC_PAGES` (`RbacPageSpec` exige `route`). El backend
 * exige `chatbot:c` en todo el router `/chatbot` (crear, listar, leer, renombrar
 * y archivar conversaciones), así que el panel se gatea con ese único permiso:
 * sin él, cualquier request del panel responde 403.
 *
 * Eje único a propósito: las conversaciones son del propio usuario y no mutan
 * nada de la organización. Ver ia context/rbac-audit-guide.md (18ª pasada).
 *
 * Se resuelve con un hook y no con props desde el punto de montaje porque
 * `WisyToggle` guarda el elemento `<WisyPanel />` dentro del estado del
 * `GlobalPanelProvider` al momento del clic: una prop calculada ahí quedaría
 * congelada con los permisos que había en ese instante.
 */
export function useWisyAccess() {
  const { hasAnyPermission, isLoading } = useUserPermissions();

  const canUseWisy = useMemo(
    () => hasAnyPermission(["chatbot:c"]),
    [hasAnyPermission]
  );

  return { canUseWisy, isLoading };
}
