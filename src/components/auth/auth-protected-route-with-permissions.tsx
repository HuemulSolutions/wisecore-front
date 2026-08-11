import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/auth-context';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useOrganization } from '@/contexts/organization-context';
import { AuthPage } from '@/pages/auth';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { HuemulAccessDenied } from '@/huemul/components/huemul-access-denied';
import { Button } from '@/components/ui/button';
import type { Permission } from '@/lib/jwt-utils';
import type { ProtectedRouteWithPermissionsProps as ProtectedRouteProps } from '@/types/auth'

export type { ProtectedRouteWithPermissionsProps as ProtectedRouteProps } from '@/types/auth'

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
    hasLoadedPermissionsOnce,
    isRootAdmin,
    isOrgAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
  } = useUserPermissions();
  const { organizationToken } = useOrganization();
  const { orgId } = useParams<{ orgId: string }>();

  // If we're on an org-scoped route but the org token hasn't been generated
  // yet (e.g. deep-link OrgSync is in progress), wait before checking perms.
  const orgTokenPending = !!orgId && orgId !== '_' && !organizationToken;

  // There's an org token but PermissionsProvider hasn't resolved a valid
  // (non-empty) permissions read yet — e.g. right after a hard deep-link
  // load, before its polling loop catches up. Without this, an empty-but-
  // not-"loading" permissions read gets treated as "denied" below and
  // bounces the user to /home. See http-client.ts hydration for the actual
  // root-cause fix; this is defense in depth.
  const permissionsNeverLoaded = !hasLoadedPermissionsOnce && !!organizationToken;

  // Mostrar loading mientras se cargan datos. El header ya está montado
  // (AppLayout), así que solo el cuerpo muestra el skeleton.
  if (authLoading || permissionsLoading || orgTokenPending || permissionsNeverLoaded) {
    return <PageSkeleton />;
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
  // Solo isRootAdmin puede acceder, isOrgAdmin NO.
  // hasLoadedPermissionsOnce en el AND es defensa en profundidad: todo root
  // admin legítimo lo tiene en true (isRootAdmin viene del token de LOGIN,
  // no del de organización, así que hasValidData es true sin necesidad de
  // seleccionar org). Sin este flag, un isRootAdmin stale del usuario
  // anterior en esta misma pestaña (ver session-events.ts) podría colarse
  // aquí durante la ventana entre el logout y el primer refresh forzado.
  if (requireRootAdmin) {
    if (isRootAdmin && hasLoadedPermissionsOnce) {
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
    // Persist the intended URL so we can restore it after login / token refresh.
    const intended = window.location.pathname + window.location.search;
    if (intended !== redirectTo && intended !== '/') {
      sessionStorage.setItem('returnUrl', intended);
    }
    return showErrorPage ? <AccessDeniedPage /> : <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

// Componente para mostrar página de acceso denegado.
// Delega en HuemulAccessDenied (ver ia context/rbac-permissions-guide.md) para
// no duplicar el bloque de 403 que ya existe en el resto de las páginas.
function AccessDeniedPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <HuemulAccessDenied
        variant="page"
        action={
          <div className="flex flex-col gap-2">
            <Button variant="default" onClick={() => window.history.back()}>
              {t('goBack')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/home')}>
              {t('goToHome')}
            </Button>
          </div>
        }
      />
    </div>
  );
}
