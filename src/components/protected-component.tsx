import type { ReactNode } from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import type { Permission } from '@/lib/jwt-utils';

interface ProtectedComponentProps {
  children: ReactNode;
  
  // Verificación por permisos específicos
  permission?: Permission | string;
  permissions?: (Permission | string)[];
  requireAllPermissions?: boolean; // Si true, requiere TODOS los permisos, si false solo uno
  
  // Verificación por roles
  role?: string;
  roles?: string[];
  requireAllRoles?: boolean; // Si true, requiere TODOS los roles, si false solo uno
  
  // Verificación por recursos (shortcuts)
  resource?: string;
  resourceAction?: 'c' | 'r' | 'u' | 'd' | 'l' | 'manage';
  resourceActions?: ('c' | 'r' | 'u' | 'd' | 'l' | 'manage')[]; 
  
  // Solo para root admin
  requireRootAdmin?: boolean;
  
  // Mostrar solo si NO tiene permisos (para casos especiales)
  inverse?: boolean;
  
  // Componente alternativo a mostrar cuando no tiene permisos
  fallback?: ReactNode;
  
  // Modo de carga
  showLoadingFallback?: boolean;
  loadingFallback?: ReactNode;
}

/**
 * Componente que muestra u oculta contenido basado en los permisos del usuario
 * 
 * Ejemplos de uso:
 * 
 * // Mostrar solo si tiene permiso específico
 * <ProtectedComponent permission="user:c">
 *   <CreateUserButton />
 * </ProtectedComponent>
 * 
 * // Mostrar si tiene cualquiera de los permisos
 * <ProtectedComponent permissions={["user:r", "user:l"]}>
 *   <UsersList />
 * </ProtectedComponent>
 * 
 * // Mostrar si tiene todos los permisos
 * <ProtectedComponent permissions={["user:r", "user:u"]} requireAllPermissions>
 *   <EditUserForm />
 * </ProtectedComponent>
 * 
 * // Usar shortcut por recurso
 * <ProtectedComponent resource="user" resourceAction="c">
 *   <CreateUserButton />
 * </ProtectedComponent>
 * 
 * // Solo para root admin
 * <ProtectedComponent requireRootAdmin>
 *   <AdminPanel />
 * </ProtectedComponent>
 * 
 * // Mostrar fallback cuando no tiene permisos
 * <ProtectedComponent 
 *   permission="user:c" 
 *   fallback={<div>No tienes permisos para crear usuarios</div>}
 * >
 *   <CreateUserButton />
 * </ProtectedComponent>
 */
export default function ProtectedComponent({
  children,
  permission,
  permissions,
  requireAllPermissions = false,
  role,
  roles,
  requireAllRoles = false,
  resource,
  resourceAction,
  resourceActions,
  requireRootAdmin = false,
  inverse = false,
  fallback = null,
  showLoadingFallback = false,
  loadingFallback = null,
}: ProtectedComponentProps) {
  const {
    isLoading,
    isRootAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
  } = useUserPermissions();

  // Mostrar loading si está configurado
  if (isLoading && showLoadingFallback) {
    return <>{loadingFallback}</>;
  }

  // Si requiere ser root admin y no lo es, denegar acceso
  if (requireRootAdmin && !isRootAdmin) {
    return inverse ? <>{children}</> : <>{fallback}</>;
  }

  // Si es root admin y no está en modo inverso, permitir acceso
  if (isRootAdmin && !inverse) {
    return <>{children}</>;
  }

  let hasAccess = false;

  // Verificar permiso específico
  if (permission) {
    hasAccess = hasPermission(permission);
  }

  // Verificar múltiples permisos
  if (permissions && permissions.length > 0) {
    if (requireAllPermissions) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  }

  // Verificar por recurso y acción
  if (resource && resourceAction) {
    hasAccess = hasPermission(`${resource}:${resourceAction}` as Permission);
  }

  // Verificar por recurso y múltiples acciones
  if (resource && resourceActions && resourceActions.length > 0) {
    const resourcePermissions = resourceActions.map(action => `${resource}:${action}` as Permission);
    hasAccess = hasAnyPermission(resourcePermissions);
  }

  // Verificar rol específico
  if (role) {
    hasAccess = hasRole(role);
  }

  // Verificar múltiples roles
  if (roles && roles.length > 0) {
    if (requireAllRoles) {
      hasAccess = roles.every(roleId => hasRole(roleId));
    } else {
      hasAccess = hasAnyRole(roles);
    }
  }

  // Si no se especificó ninguna condición, permitir acceso por defecto
  if (!permission && 
      (!permissions || permissions.length === 0) && 
      !resource && 
      !role && 
      (!roles || roles.length === 0) && 
      !requireRootAdmin) {
    hasAccess = true;
  }

  // Aplicar lógica inversa si está configurada
  if (inverse) {
    hasAccess = !hasAccess;
  }

  // Retornar contenido o fallback
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}