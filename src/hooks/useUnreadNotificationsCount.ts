import { useQuery } from "@tanstack/react-query"
import { getNotifications } from "@/services/notifications"
import { useUserPermissions } from "@/hooks/useUserPermissions"

/**
 * Returns the number of unread notifications for the current organization.
 * Polls periodically so the header badge stays current. Shares the
 * ["notifications", ...] key prefix, so notification mutations invalidate it.
 * Gated on RBAC: sin permiso para LISTAR notificaciones, no se hace polling.
 * `notification:l|r` y no el helper `canAccessNotifications` (cualquier acción
 * sobre el recurso): esto es una lectura, y el gate debe ser el del endpoint
 * que dispara. Mismo criterio en NotificationsSheet y en el header.
 */
export function useUnreadNotificationsCount(organizationId: string | null | undefined): number {
  const { hasAnyPermission } = useUserPermissions()
  const canListNotifications = hasAnyPermission(["notification:l", "notification:r"])

  const { data } = useQuery({
    queryKey: ["notifications", "unread-count", organizationId],
    queryFn: () =>
      getNotifications(organizationId as string, { is_read: false, page_size: 100 }),
    enabled: !!organizationId && canListNotifications,
    refetchInterval: 600000,
    refetchOnWindowFocus: true,
    staleTime: 30000,
  })

  return data?.total ?? data?.data.length ?? 0
}
