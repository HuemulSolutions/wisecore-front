import { useQuery } from "@tanstack/react-query"
import { useOrganization } from "@/contexts/organization-context"
import { getDocumentTypesWithInfo } from "@/services/role-document-type"

interface DocumentTypeForRole {
  id: string
  name: string
  access_level: string[]
  color?: string
}

/**
 * Hook to fetch document types that the current user can create.
 * Uses unified endpoint that handles both admin and regular users.
 * Backend filters based on user token - admin gets all, regular users get filtered by role.
 */
export function useRoleDocumentTypes(enableFetch: boolean = true) {
  const { selectedOrganizationId } = useOrganization()

  return useQuery({
    queryKey: ['role-document-types', selectedOrganizationId],
    queryFn: async (): Promise<DocumentTypeForRole[]> => {
      const response = await getDocumentTypesWithInfo()
      
      // Filter only types where user has 'create' permission
      return response.data
        .filter(item => item.access_level.includes('create'))
        .map(item => ({
          id: item.id,
          name: item.name,
          access_level: item.access_level,
          color: item.color
        }))
    },
    enabled: enableFetch && !!selectedOrganizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
