import { useQuery } from '@tanstack/react-query'
import { getAccessLevels } from '@/services/access-levels'

/**
 * Hook para obtener los niveles de acceso disponibles
 */
export function useAccessLevels() {
  return useQuery({
    queryKey: ['access-levels'],
    queryFn: getAccessLevels,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  })
}

/**
 * Hook utilitario para validar access levels de un documento
 */
export function useDocumentAccess(documentAccessLevels?: string[]) {
  const result = {
    canRead: documentAccessLevels?.includes('read') ?? false,
    canEdit: documentAccessLevels?.includes('edit') ?? false,
    canCreate: documentAccessLevels?.includes('create') ?? false,
    canDelete: documentAccessLevels?.includes('delete') ?? false,
    canApprove: documentAccessLevels?.includes('approve') ?? false,
    
    // Función para validar un access level específico
    hasAccess: (accessLevel: string) => documentAccessLevels?.includes(accessLevel) ?? false,
    
    // Función para validar múltiples access levels (debe tener al menos uno)
    hasAnyAccess: (accessLevels: string[]) => 
      accessLevels.some(level => documentAccessLevels?.includes(level)) ?? false,
    
    // Función para validar múltiples access levels (debe tener todos)
    hasAllAccess: (accessLevels: string[]) => 
      accessLevels.every(level => documentAccessLevels?.includes(level)) ?? false,
    
    // Función para verificar si el usuario puede leer el documento
    // Retorna true si tiene al menos uno de: read, edit, create, approve
    canReadDocument: () => 
      documentAccessLevels?.some(level => 
        ['read', 'edit', 'create', 'approve'].includes(level)
      ) ?? false
  }
  
  return result
}

/**
 * Función helper para verificar si un array de access levels permite lectura
 * Útil para usar fuera del contexto de un hook de React
 */
export function canReadDocument(accessLevels?: string[]): boolean {
  return accessLevels?.some(level => 
    ['read', 'edit', 'create', 'approve'].includes(level)
  ) ?? false
}