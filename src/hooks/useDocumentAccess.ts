import { useQuery } from '@tanstack/react-query'
import { getAccessLevels } from '@/services/access-levels'
import type { FrontendPermissions, LifecyclePermissions, LifecycleStatus } from '@/types/assets'

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

/** Maps a document access level string to its lifecycle permission key */
function toLifecycleKey(access: string): keyof LifecyclePermissions | null {
  switch (access) {
    case 'create':  return 'create'
    case 'edit':    return 'edit'
    case 'read':    return 'view'
    case 'view':    return 'view'
    case 'approve': return 'approve'
    case 'review':  return 'review'
    case 'publish': return 'publish'
    case 'archive': return 'archive'
    default:        return null // e.g. "delete" has no lifecycle equivalent → no restriction
  }
}

/**
 * Returns true if the lifecycle permissions allow the given access level.
 * If there is no lifecycle equivalent for the access level (e.g. "delete"), it returns true.
 */
export function lifecycleAllows(
  permissions: LifecyclePermissions | undefined,
  access: string
): boolean {
  if (!permissions) return true
  const key = toLifecycleKey(access)
  if (!key) return true
  return permissions[key] === true
}

/**
 * Hook utilitario para validar lifecycle permissions de un documento.
 */
export function useLifecyclePermissions(permissions?: LifecyclePermissions) {
  return {
    canView:    permissions?.view    ?? false,
    canCreate:  permissions?.create  ?? false,
    canEdit:    permissions?.edit    ?? false,
    canReview:  permissions?.review  ?? false,
    canApprove: permissions?.approve ?? false,
    canPublish: permissions?.publish ?? false,
    canArchive: permissions?.archive ?? false,

    /** True if the lifecycle allows the given access (e.g. "edit", "create", "approve") */
    hasLifecycleAccess: (access: string) => lifecycleAllows(permissions, access),

    /** True if the lifecycle allows ANY of the given access levels */
    hasAnyLifecycleAccess: (accesses: string[]) =>
      accesses.some(a => lifecycleAllows(permissions, a)),

    /** True if the lifecycle allows ALL of the given access levels */
    hasAllLifecycleAccess: (accesses: string[]) =>
      accesses.every(a => lifecycleAllows(permissions, a)),
  }
}

/**
 * Computes high-level frontend permissions directly from lifecycle_permissions.
 * A frontend permission is true whenever the user holds the relevant lifecycle role,
 * regardless of the document's current stage — individual buttons are responsible
 * for deciding whether to act on them given the current stage.
 */
export function computeFrontendPermissions(
  permissions?: LifecyclePermissions,
  status?: LifecycleStatus,
): FrontendPermissions {
  const hasCreate = permissions?.create === true
  const hasEdit = permissions?.edit === true
  const hasReview = permissions?.review === true
  const hasApprove = permissions?.approve === true
  const hasPublish = permissions?.publish === true
  const hasArchive = permissions?.archive === true
  const isEditStage = status?.stage === 'edit'

  return {
    canEditSections: (hasCreate || hasEdit) && isEditStage,
    canAccessSectionSheet: hasCreate || hasEdit || hasReview || hasApprove || hasPublish,
    canExecuteAI: hasCreate || hasEdit,
    canReviewContent: hasReview,
    canApproveContent: hasApprove,
    canPublishContent: hasPublish,
    canArchiveContent: hasArchive,
  }
}