import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { 
  getCurrentUserInfo,
  type Permission 
} from '@/lib/jwt-utils';

export interface PermissionsContextType {
  // Estado actual
  permissions: string[];
  roles: string[];
  isRootAdmin: boolean;
  isOrgAdmin: boolean;
  isLoading: boolean;
  
  // Funciones de verificación
  hasPermission: (permission: Permission | string) => boolean;
  hasAnyPermission: (permissions: (Permission | string)[]) => boolean;
  hasAllPermissions: (permissions: (Permission | string)[]) => boolean;
  hasRole: (roleId: string) => boolean;
  hasAnyRole: (roleIds: string[]) => boolean;
  
  // Funciones de utilidad
  refreshPermissions: (forceClean?: boolean) => void;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

interface PermissionsProviderProps {
  children: ReactNode;
}

export const PermissionsProvider = ({ children }: PermissionsProviderProps) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [isRootAdminState, setIsRootAdminState] = useState(false);
  const [isOrgAdminState, setIsOrgAdminState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Track whether we have ever loaded a valid set of permissions.
  // Used to avoid wiping valid permissions during transient token-expiry windows.
  const hasLoadedValidPermissions = useRef(false);

  // Función para refrescar permisos desde los tokens JWT.
  // forceClean=true: always clear state (use on explicit logout).
  const refreshPermissions = useCallback((forceClean = false) => {
    // Only show loading on initial load or forced clean.
    // Subsequent refreshes (polling, org-switch) skip the loading toggle
    // to avoid a cascade of re-renders across all consumers.
    if (!hasLoadedValidPermissions.current || forceClean) {
      setIsLoading(true);
    }
    
    try {
      const userInfo = getCurrentUserInfo();

      const hasValidData =
        (userInfo.permissions?.length ?? 0) > 0 ||
        userInfo.isRootAdmin ||
        userInfo.isOrgAdmin;

      if (userInfo.isAuthenticated && hasValidData) {
        // Got real, non-empty data — update state.
        hasLoadedValidPermissions.current = true;
        setPermissions(userInfo.permissions || []);
        setRoles(userInfo.roles || []);
        setIsRootAdminState(userInfo.isRootAdmin || false);
        setIsOrgAdminState(userInfo.isOrgAdmin || false);
        console.log('Permissions refreshed:', {
          permissions: userInfo.permissions,
          roles: userInfo.roles,
          isRootAdmin: userInfo.isRootAdmin,
          isOrgAdmin: userInfo.isOrgAdmin,
        });
      } else if (!forceClean && hasLoadedValidPermissions.current) {
        // The token read came back empty/unauthenticated, but we already have
        // valid permissions in state. This is most likely a transient race:
        // the org JWT just expired and hasn't been replaced yet. Keep the
        // existing state so route guards don't redirect the user.
        console.warn(
          'Permissions refresh: received empty data while session appears active. ' +
          'Retaining existing permissions to avoid spurious redirect.',
          { isAuthenticated: userInfo.isAuthenticated, hasValidData }
        );
      } else {
        // Initial load (nothing valid yet) or explicit forceClean — clear.
        setPermissions([]);
        setRoles([]);
        setIsRootAdminState(false);
        setIsOrgAdminState(false);
        console.log('Permissions cleared.', { forceClean, isAuthenticated: userInfo.isAuthenticated });
      }
    } catch (error) {
      console.error('Error refreshing permissions:', error);
      if (forceClean) {
        setPermissions([]);
        setRoles([]);
        setIsRootAdminState(false);
        setIsOrgAdminState(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto para cargar permisos iniciales con un pequeño delay
  useEffect(() => {
    // Pequeño delay para asegurar que otros contextos estén listos
    const timer = setTimeout(() => {
      refreshPermissions();
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  // Efecto para escuchar cambios en los tokens
  useEffect(() => {
    // Poll for token changes (e.g. org switch, role update).
    // Only act when the NEW data is valid and non-empty — otherwise we'd
    // incorrectly clear permissions every time the org JWT transiently expires.
    const checkTokensInterval = setInterval(() => {
      const currentUserInfo = getCurrentUserInfo();

      const currentPermissions = currentUserInfo?.permissions ?? [];
      const currentRoles = currentUserInfo?.roles ?? [];
      const currentIsRootAdmin = currentUserInfo?.isRootAdmin ?? false;
      const currentIsOrgAdmin = currentUserInfo?.isOrgAdmin ?? false;
      const currentIsAuthenticated = currentUserInfo?.isAuthenticated ?? false;

      // Only proceed when the token contains real, valid data.
      const hasNewValidData =
        currentIsAuthenticated &&
        (currentPermissions.length > 0 || currentIsRootAdmin || currentIsOrgAdmin);

      if (
        hasNewValidData &&
        (
          JSON.stringify(currentPermissions) !== JSON.stringify(permissions) ||
          JSON.stringify(currentRoles) !== JSON.stringify(roles) ||
          currentIsRootAdmin !== isRootAdminState ||
          currentIsOrgAdmin !== isOrgAdminState
        )
      ) {
        console.log('Token changes detected, refreshing permissions...');
        refreshPermissions();
      }
    }, 2000);

    return () => clearInterval(checkTokensInterval);
  }, [permissions, roles, isRootAdminState, isOrgAdminState]);

  // Escuchar cambios en localStorage (por ejemplo, logout)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' || e.key === 'organizationToken') {
        console.log('Storage change detected, refreshing permissions...');
        // forceClean when a token is explicitly removed (logout / org reset)
        const forceClean = e.newValue === null;
        refreshPermissions(forceClean);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Funciones de verificación que usan el estado local para mejor rendimiento
  // NOTA: isOrgAdmin hace bypass de permisos, isRootAdmin NO (solo da acceso a rutas admin)
  const checkPermission = useCallback((permission: Permission | string): boolean => {
    if (isOrgAdminState) return true;
    return permissions.includes(permission);
  }, [permissions, isOrgAdminState]);

  const checkAnyPermission = useCallback((permissionsToCheck: (Permission | string)[]): boolean => {
    if (isOrgAdminState) return true;
    return permissionsToCheck.some(permission => permissions.includes(permission));
  }, [permissions, isOrgAdminState]);

  const checkAllPermissions = useCallback((permissionsToCheck: (Permission | string)[]): boolean => {
    if (isOrgAdminState) return true;
    return permissionsToCheck.every(permission => permissions.includes(permission));
  }, [permissions, isOrgAdminState]);

  const checkRole = useCallback((roleId: string): boolean => {
    return roles.includes(roleId);
  }, [roles]);

  const checkAnyRole = useCallback((roleIds: string[]): boolean => {
    return roleIds.some(roleId => roles.includes(roleId));
  }, [roles]);

  const value: PermissionsContextType = useMemo(() => ({
    permissions,
    roles,
    isRootAdmin: isRootAdminState,
    isOrgAdmin: isOrgAdminState,
    isLoading,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    hasRole: checkRole,
    hasAnyRole: checkAnyRole,
    refreshPermissions,
  }), [permissions, roles, isRootAdminState, isOrgAdminState, isLoading, checkPermission, checkAnyPermission, checkAllPermissions, checkRole, checkAnyRole, refreshPermissions]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};