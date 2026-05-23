import type React from 'react'
import type { LifecyclePermissions } from '@/types/assets'

export interface DocumentAccessControlProps {
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

export interface DocumentActionButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
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
