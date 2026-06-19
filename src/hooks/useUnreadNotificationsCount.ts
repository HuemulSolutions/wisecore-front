import { useQuery } from "@tanstack/react-query"
import { getNotifications } from "@/services/notifications"

/**
 * Returns the number of unread notifications for the current organization.
 * Polls periodically so the header badge stays current. Shares the
 * ["notifications", ...] key prefix, so notification mutations invalidate it.
 */
export function useUnreadNotificationsCount(organizationId: string | null | undefined): number {
  const { data } = useQuery({
    queryKey: ["notifications", "unread-count", organizationId],
    queryFn: () =>
      getNotifications(organizationId as string, { is_read: false, page_size: 100 }),
    enabled: !!organizationId,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    staleTime: 30000,
  })

  return data?.total ?? data?.data.length ?? 0
}
