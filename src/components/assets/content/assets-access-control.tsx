import React from 'react'
import { Button } from '@/components/ui/button'
import { useDocumentAccess } from '@/hooks/useDocumentAccess'
import { useUserPermissions } from '@/hooks/useUserPermissions'

interface DocumentAccessControlProps {
  accessLevels?: string[]
  requiredAccess: string | string[]
  requireAll?: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
  /** Si se debe verificar también los permisos globales del usuario (asset:*, folder:*, etc.) */
  checkGlobalPermissions?: boolean
  /** Recurso para verificar permisos globales (ej: 'asset', 'folder', 'context') */
  resource?: string
}

/**
 * Componente que controla la visibilidad de elementos basándose en access levels del documento
 * y opcionalmente en los permisos globales del usuario
 */
export function DocumentAccessControl({
  accessLevels,
  requiredAccess,
  requireAll = false,
  children,
  fallback = null,
  checkGlobalPermissions = false,
  resource
}: DocumentAccessControlProps) {
  const { hasAccess, hasAnyAccess, hasAllAccess } = useDocumentAccess(accessLevels)
  const { canCreate, canRead, canUpdate, canDelete, isRootAdmin } = useUserPermissions()
  
  let hasDocumentPermission = false
  
  // Verificar access levels del documento
  if (typeof requiredAccess === 'string') {
    hasDocumentPermission = hasAccess(requiredAccess)
  } else if (Array.isArray(requiredAccess)) {
    if (requireAll) {
      hasDocumentPermission = hasAllAccess(requiredAccess)
    } else {
      hasDocumentPermission = hasAnyAccess(requiredAccess)
    }
  }
  
  // Si se requiere verificación de permisos globales
  if (checkGlobalPermissions && resource && !isRootAdmin) {
    const requiredAccessArray = Array.isArray(requiredAccess) ? requiredAccess : [requiredAccess]
    
    // Mapear access levels del documento a acciones CRUD
    const globalPermissionChecks = requiredAccessArray.map(access => {
      switch (access) {
        case 'create':
          return canCreate(resource)
        case 'read':
          return canRead(resource)
        case 'edit':
          return canUpdate(resource)
        case 'delete':
          return canDelete(resource)
        case 'approve':
          return canUpdate(resource) // approve requiere permiso de actualización
        default:
          return true // Por defecto permitir si no es una acción reconocida
      }
    })
    
    const hasGlobalPermission = requireAll 
      ? globalPermissionChecks.every(check => check)
      : globalPermissionChecks.some(check => check)
    
    // Debe tener AMBOS: access level del documento Y permiso global
    return (hasDocumentPermission && hasGlobalPermission) ? <>{children}</> : <>{fallback}</>
  }
  
  // Si no se requiere verificación global, solo verificar access levels del documento
  return hasDocumentPermission ? <>{children}</> : <>{fallback}</>
}

/**
 * Componente específico para botones de acciones de documentos
 * Combina verificación de access levels del documento con permisos globales del usuario
 */
interface DocumentActionButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  accessLevels?: string[]
  requiredAccess: string | string[]
  requireAll?: boolean
  children: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** Si se debe verificar también los permisos globales del usuario */
  checkGlobalPermissions?: boolean
  /** Recurso para verificar permisos globales (ej: 'asset', 'folder', 'context') */
  resource?: string
}

export function DocumentActionButton({
  accessLevels,
  requiredAccess,
  requireAll = false,
  children,
  checkGlobalPermissions = false,
  resource,
  ...buttonProps
}: DocumentActionButtonProps) {
  const { hasAccess, hasAnyAccess, hasAllAccess } = useDocumentAccess(accessLevels)
  const { canCreate, canRead, canUpdate, canDelete, isRootAdmin } = useUserPermissions()
  
  let hasDocumentPermission = false
  
  // Verificar access levels del documento
  if (typeof requiredAccess === 'string') {
    hasDocumentPermission = hasAccess(requiredAccess)
  } else if (Array.isArray(requiredAccess)) {
    if (requireAll) {
      hasDocumentPermission = hasAllAccess(requiredAccess)
    } else {
      hasDocumentPermission = hasAnyAccess(requiredAccess)
    }
  }
  
  // Si se requiere verificación de permisos globales
  if (checkGlobalPermissions && resource && !isRootAdmin) {
    const requiredAccessArray = Array.isArray(requiredAccess) ? requiredAccess : [requiredAccess]
    
    // Mapear access levels del documento a acciones CRUD
    const globalPermissionChecks = requiredAccessArray.map(access => {
      switch (access) {
        case 'create':
          return canCreate(resource)
        case 'read':
          return canRead(resource)
        case 'edit':
          return canUpdate(resource)
        case 'delete':
          return canDelete(resource)
        case 'approve':
          return canUpdate(resource) // approve requiere permiso de actualización
        default:
          return true
      }
    })
    
    const hasGlobalPermission = requireAll 
      ? globalPermissionChecks.every(check => check)
      : globalPermissionChecks.some(check => check)
    
    // Debe tener AMBOS: access level del documento Y permiso global
    if (!hasDocumentPermission || !hasGlobalPermission) {
      return null
    }
  } else if (!hasDocumentPermission) {
    // Si no tiene permiso de documento, no renderizar
    return null
  }
  
  return (
    <Button className="hover:cursor-pointer" {...buttonProps}>
      {children}
    </Button>
  )
}
