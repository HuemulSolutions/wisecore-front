import React from 'react'
import { Button } from '@/components/ui/button'
import { lifecycleAllows } from '@/hooks/useDocumentAccess'
import { useUserPermissions } from '@/hooks/useUserPermissions'
import type { LifecyclePermissions } from '@/types/assets'

interface DocumentAccessControlProps {
  requiredAccess: string | string[]
  requireAll?: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
  /** Si se debe verificar también los permisos globales del usuario (asset:*, folder:*, etc.) */
  checkGlobalPermissions?: boolean
  /** Recurso para verificar permisos globales (ej: 'asset', 'folder', 'context') */
  resource?: string
  /** Lifecycle permissions from the document content response */
  lifecyclePermissions?: LifecyclePermissions
}

/**
 * Componente que controla la visibilidad de elementos basándose en access levels del documento
 * y opcionalmente en los permisos globales del usuario
 */
export function DocumentAccessControl({
  requiredAccess,
  requireAll = false,
  children,
  fallback = null,
  checkGlobalPermissions = false,
  resource,
  lifecyclePermissions,
}: DocumentAccessControlProps) {
  const { canCreate, canRead, canUpdate, canDelete, isRootAdmin } = useUserPermissions()

  // Verificar lifecycle permissions (si se proporcionan)
  if (lifecyclePermissions) {
    const requiredAccessArray = Array.isArray(requiredAccess) ? requiredAccess : [requiredAccess]
    const lifecycleChecks = requiredAccessArray.map(access => lifecycleAllows(lifecyclePermissions, access))
    const hasLifecyclePermission = requireAll
      ? lifecycleChecks.every(Boolean)
      : lifecycleChecks.some(Boolean)
    if (!hasLifecyclePermission) return <>{fallback}</>
  }

  // Si se requiere verificación de permisos globales
  if (checkGlobalPermissions && resource && !isRootAdmin) {
    const requiredAccessArray = Array.isArray(requiredAccess) ? requiredAccess : [requiredAccess]

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
          return canUpdate(resource)
        default:
          return true
      }
    })

    const hasGlobalPermission = requireAll
      ? globalPermissionChecks.every(check => check)
      : globalPermissionChecks.some(check => check)

    return hasGlobalPermission ? <>{children}</> : <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Componente específico para botones de acciones de documentos
 * Combina verificación de access levels del documento con permisos globales del usuario
 */
interface DocumentActionButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
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
  requiredAccess,
  requireAll = false,
  children,
  checkGlobalPermissions = false,
  resource,
  ...buttonProps
}: DocumentActionButtonProps) {
  const { canCreate, canRead, canUpdate, canDelete, isRootAdmin } = useUserPermissions()

  // Si se requiere verificación de permisos globales
  if (checkGlobalPermissions && resource && !isRootAdmin) {
    const requiredAccessArray = Array.isArray(requiredAccess) ? requiredAccess : [requiredAccess]

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
          return canUpdate(resource)
        default:
          return true
      }
    })

    const hasGlobalPermission = requireAll
      ? globalPermissionChecks.every(check => check)
      : globalPermissionChecks.some(check => check)

    if (!hasGlobalPermission) return null
  }

  return (
    <Button className="hover:cursor-pointer" {...buttonProps}>
      {children}
    </Button>
  )
}
