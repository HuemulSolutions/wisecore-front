import { useQuery } from "@tanstack/react-query"
import { useOrganization } from "@/contexts/organization-context"
import { getRolePermissions, type RoleDocumentTypesResponse } from "@/services/role-document-type"
import { getAllDocumentTypes } from "@/services/document_type"
import { getOrganizationTokenInfo, isRootAdmin } from "@/lib/jwt-utils"

interface DocumentTypeForRole {
  id: string
  name: string
  access_level: string
  color?: string
}

export function useRoleDocumentTypes(enableFetch: boolean = true) {
  const { selectedOrganizationId } = useOrganization()
  
  // Obtener el role_id del token de organización
  const getCurrentRoleId = (): string | null => {
    const tokenInfo = getOrganizationTokenInfo()
    if (!tokenInfo?.roles?.length) {
      // Solo loggear si estamos habilitados para hacer fetch y no somos admin
      if (enableFetch && !isRootAdmin()) {
        console.warn("No roles found in organization token")
      }
      return null
    }
    // Usar el primer rol disponible en el token
    return tokenInfo.roles[0]
  }

  return useQuery({
    queryKey: ['role-document-types', selectedOrganizationId, getCurrentRoleId(), isRootAdmin()],
    queryFn: async (): Promise<DocumentTypeForRole[]> => {
      // Si es administrador, obtener todos los tipos de documento
      if (isRootAdmin()) {
        console.log("Admin user detected - fetching all document types")
        const allDocTypes = await getAllDocumentTypes(selectedOrganizationId!)
        
        // Transformar para que coincida con la interfaz esperada
        return allDocTypes.map((type: any) => ({
          id: type.id,
          name: type.name,
          access_level: 'admin', // Indicar que es acceso de admin
          color: type.color // Incluir el color del tipo de documento
        }))
      }
      
      // Para usuarios regulares, usar la lógica basada en roles
      const roleId = getCurrentRoleId()
      if (!roleId) {
        throw new Error("No role found in organization token")
      }
      
      console.log("Fetching document types for role:", roleId)
      const response: RoleDocumentTypesResponse = await getRolePermissions(roleId)
      
      // Transformar la respuesta y filtrar solo los tipos donde el usuario puede crear
      const filteredTypes = response.data
        .filter(item => item.access_level && item.access_level !== 'read') // Solo incluir tipos con permisos de creación
        .map(item => ({
          id: item.document_type_id,
          name: item.document_type_name || '',
          access_level: item.access_level || ''
        }))
      
      console.log("Filtered document types for creation:", filteredTypes)
      return filteredTypes
    },
    enabled: enableFetch && 
             !!selectedOrganizationId && 
             (isRootAdmin() || (!!getCurrentRoleId() && !!getOrganizationTokenInfo())),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: (failureCount, error) => {
      // No reintentar si no hay roles válidos
      if (error.message?.includes("No role found")) {
        return false
      }
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}