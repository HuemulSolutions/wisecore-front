import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { AuthPage } from '@/pages/auth';
import type { Permission } from '@/lib/jwt-utils';

interface ProtectedRouteProps {
  children: ReactNode;
  
  // Verificación por permisos específicos
  permission?: Permission | string;
  permissions?: (Permission | string)[];
  requireAllPermissions?: boolean;
  
  // Verificación por roles
  role?: string;
  roles?: string[];
  requireAllRoles?: boolean;
  
  // Verificación por recursos
  resource?: string;
  resourceAction?: 'c' | 'r' | 'u' | 'd' | 'l' | 'manage';
  resourceActions?: ('c' | 'r' | 'u' | 'd' | 'l' | 'manage')[];
  
  // Solo para root admin
  requireRootAdmin?: boolean;
  
  // Página a la que redirigir si no tiene permisos (por defecto /home)
  redirectTo?: string;
  
  // Mostrar página de error en lugar de redirigir
  showErrorPage?: boolean;
}

/**
 * Componente que protege rutas basado en autenticación y permisos
 * 
 * Primero verifica autenticación, luego verifica permisos
 * 
 * NOTA sobre roles de admin:
 * - isRootAdmin: Solo da acceso a rutas con requireRootAdmin=true (admin técnico)
 * - isOrgAdmin: Hace bypass de permisos para rutas de organización (admin de negocio)
 * 
 * Ejemplos de uso:
 * 
 * // Solo autenticación
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * // Requiere permiso específico
 * <ProtectedRoute permission="user:c">
 *   <CreateUserPage />
 * </ProtectedRoute>
 * 
 * // Solo para root admin (rutas técnicas/administrativas)
 * <ProtectedRoute requireRootAdmin>
 *   <AdminPanel />
 * </ProtectedRoute>
 * 
 * // Con redirección personalizada
 * <ProtectedRoute permission="asset:r" redirectTo="/dashboard">
 *   <AssetsPage />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
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
  redirectTo = '/home',
  showErrorPage = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    isLoading: permissionsLoading,
    isRootAdmin,
    isOrgAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
  } = useUserPermissions();

  // Mostrar loading mientras se cargan datos
  if (authLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Si no está autenticado, mostrar página de login
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Si no se requieren permisos específicos, permitir acceso
  const needsPermissionCheck = permission || 
                              (permissions && permissions.length > 0) || 
                              role || 
                              (roles && roles.length > 0) || 
                              resource || 
                              requireRootAdmin;

  if (!needsPermissionCheck) {
    return <>{children}</>;
  }

  // Rutas que requieren root admin (rutas técnicas/administrativas)
  // Solo isRootAdmin puede acceder, isOrgAdmin NO
  if (requireRootAdmin) {
    if (isRootAdmin) {
      return <>{children}</>;
    }
    return showErrorPage ? <AccessDeniedPage /> : <Navigate to={redirectTo} replace />;
  }

  // Para rutas normales (no requireRootAdmin):
  // - isOrgAdmin tiene acceso total (bypass de permisos)
  // - isRootAdmin NO tiene bypass, debe verificar permisos como usuario normal
  if (isOrgAdmin) {
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

  // Si no tiene acceso, mostrar error o redirigir
  if (!hasAccess) {
    return showErrorPage ? <AccessDeniedPage /> : <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

// Componente para mostrar página de acceso denegado
function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <svg
            className="w-16 h-16 text-muted-foreground mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-12a9 9 0 100 18 9 9 0 000-18z"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Access Denied
        </h1>
        
        <p className="text-muted-foreground mb-6">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        
        <div className="space-y-2">
          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            Go Back
          </button>
          
          <a
            href="/home"
            className="block w-full px-4 py-2 border border-border rounded text-foreground hover:bg-accent transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    </div>
  );
}
