import React from 'react'
import { Button } from '@/components/ui/button'
import { useDocumentAccess } from '@/hooks/useDocumentAccess'

interface DocumentAccessControlProps {
  accessLevels?: string[]
  requiredAccess: string | string[]
  requireAll?: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Componente que controla la visibilidad de elementos basándose en access levels del documento
 */
export function DocumentAccessControl({
  accessLevels,
  requiredAccess,
  requireAll = false,
  children,
  fallback = null
}: DocumentAccessControlProps) {
  const { hasAccess, hasAnyAccess, hasAllAccess } = useDocumentAccess(accessLevels)
  
  let hasPermission = false
  
  if (typeof requiredAccess === 'string') {
    hasPermission = hasAccess(requiredAccess)
  } else if (Array.isArray(requiredAccess)) {
    if (requireAll) {
      hasPermission = hasAllAccess(requiredAccess)
    } else {
      hasPermission = hasAnyAccess(requiredAccess)
    }
  }
  
  return hasPermission ? <>{children}</> : <>{fallback}</>
}

/**
 * Componente específico para botones de acciones de documentos
 */
interface DocumentActionButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  accessLevels?: string[]
  requiredAccess: string | string[]
  requireAll?: boolean
  children: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function DocumentActionButton({
  accessLevels,
  requiredAccess,
  requireAll = false,
  children,
  ...buttonProps
}: DocumentActionButtonProps) {
  const { hasAccess, hasAnyAccess, hasAllAccess } = useDocumentAccess(accessLevels)
  
  let hasPermission = false
  
  if (typeof requiredAccess === 'string') {
    hasPermission = hasAccess(requiredAccess)
  } else if (Array.isArray(requiredAccess)) {
    if (requireAll) {
      hasPermission = hasAllAccess(requiredAccess)
    } else {
      hasPermission = hasAnyAccess(requiredAccess)
    }
  }
  
  // Si no tiene permisos, no renderizar el botón
  if (!hasPermission) {
    return null
  }
  
  return (
    <Button className="hover:cursor-pointer" {...buttonProps}>
      {children}
    </Button>
  )
}