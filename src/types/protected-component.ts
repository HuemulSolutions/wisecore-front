import type { ReactNode } from "react"
import type { Permission } from "@/lib/jwt-utils"

export interface ProtectedComponentProps {
  children: ReactNode

  // Verificación por permisos específicos
  permission?: Permission | string
  permissions?: (Permission | string)[]
  requireAllPermissions?: boolean // Si true, requiere TODOS los permisos, si false solo uno

  // Verificación por roles
  role?: string
  roles?: string[]
  requireAllRoles?: boolean // Si true, requiere TODOS los roles, si false solo uno

  // Verificación por recursos (shortcuts)
  resource?: string
  resourceAction?: "c" | "r" | "u" | "d" | "l" | "manage"
  resourceActions?: ("c" | "r" | "u" | "d" | "l" | "manage")[]

  // Solo para root admin
  requireRootAdmin?: boolean

  // Mostrar solo si NO tiene permisos (para casos especiales)
  inverse?: boolean

  // Componente alternativo a mostrar cuando no tiene permisos
  fallback?: ReactNode

  // Modo de carga
  showLoadingFallback?: boolean
  loadingFallback?: ReactNode
}
