import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getOrganizationUsers, setOrganizationAdmin } from "@/services/organizations"
import { toast } from "sonner"

// Query keys for organizations
export const organizationQueryKeys = {
  all: ['organizations'] as const,
  users: (organizationId?: string, page?: number, pageSize?: number) => [
    ...organizationQueryKeys.all,
    'users',
    organizationId,
    page,
    pageSize
  ] as const,
}

// Hook for fetching users of a specific organization (root admin only)
export function useOrganizationUsers(
  organizationId?: string,
  page: number = 1,
  pageSize: number = 100
) {
  return useQuery({
    queryKey: organizationQueryKeys.users(organizationId, page, pageSize),
    queryFn: () => getOrganizationUsers(organizationId!, page, pageSize),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 0,
  })
}

// Hook for setting organization admin mutation
export function useSetOrganizationAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ organizationId, userId }: { organizationId: string; userId: string }) =>
      setOrganizationAdmin(organizationId, userId),
    onSuccess: (_, variables) => {
      // Invalidate the users query for this organization to refresh is_org_admin status
      queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.users(variables.organizationId)
      })
      toast.success('Organization admin set successfully')
    },
  })
}
