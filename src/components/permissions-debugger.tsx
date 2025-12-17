import { useUserPermissions } from '@/hooks/useUserPermissions';
import { getCurrentUserInfo } from '@/lib/jwt-utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Componente de debugging para el sistema de permisos
 * Solo se muestra en desarrollo
 */
export function PermissionsDebugger() {
  const {
    permissions,
    roles,
    isRootAdmin,
    isLoading,
    canAccessUsers,
    canAccessRoles,
    canAccessAssets,
    canAccessTemplates,
    canAccessModels,
  } = useUserPermissions();

  const userInfo = getCurrentUserInfo();

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="p-4 m-4 bg-yellow-50 border-yellow-200">
      <h3 className="text-lg font-semibold text-yellow-800 mb-3">
        🔧 Permissions Debugger (Development Only)
      </h3>
      
      <div className="space-y-3">
        {/* Estado de carga */}
        <div>
          <strong>Loading State:</strong>
          <Badge variant={isLoading ? "destructive" : "default"}>
            {isLoading ? "Loading..." : "Loaded"}
          </Badge>
        </div>

        {/* Root Admin Status */}
        <div>
          <strong>Root Admin:</strong>
          <Badge variant={isRootAdmin ? "default" : "secondary"}>
            {isRootAdmin ? "Yes" : "No"}
          </Badge>
        </div>

        {/* Token Info */}
        <div>
          <strong>Token Info:</strong>
          <div className="ml-4 text-sm">
            <div>Login Token: {userInfo.loginInfo ? "✅ Valid" : "❌ Invalid"}</div>
            <div>Organization Token: {userInfo.orgInfo ? "✅ Valid" : "❌ Invalid"}</div>
            <div>Has Organization Access: {userInfo.hasOrganizationAccess ? "✅ Yes" : "❌ No"}</div>
          </div>
        </div>

        {/* Permisos */}
        <div>
          <strong>Permissions ({permissions.length}):</strong>
          <div className="flex flex-wrap gap-1 mt-1">
            {permissions.slice(0, 10).map(permission => (
              <Badge key={permission} variant="outline" className="text-xs">
                {permission}
              </Badge>
            ))}
            {permissions.length > 10 && (
              <Badge variant="secondary" className="text-xs">
                +{permissions.length - 10} more
              </Badge>
            )}
          </div>
        </div>

        {/* Roles */}
        <div>
          <strong>Roles ({roles.length}):</strong>
          <div className="flex flex-wrap gap-1 mt-1">
            {roles.map(role => (
              <Badge key={role} variant="outline" className="text-xs">
                {role}
              </Badge>
            ))}
          </div>
        </div>

        {/* Accesos específicos */}
        <div>
          <strong>Resource Access:</strong>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="flex items-center gap-2">
              <Badge variant={canAccessUsers ? "default" : "secondary"} className="text-xs">
                Users: {canAccessUsers ? "✅" : "❌"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={canAccessRoles ? "default" : "secondary"} className="text-xs">
                Roles: {canAccessRoles ? "✅" : "❌"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={canAccessAssets ? "default" : "secondary"} className="text-xs">
                Assets: {canAccessAssets ? "✅" : "❌"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={canAccessTemplates ? "default" : "secondary"} className="text-xs">
                Templates: {canAccessTemplates ? "✅" : "❌"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={canAccessModels ? "default" : "secondary"} className="text-xs">
                Models: {canAccessModels ? "✅" : "❌"}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}