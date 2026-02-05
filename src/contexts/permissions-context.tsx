import { createContext, useContext, useEffect, useState } from 'react';
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
  refreshPermissions: () => void;
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

  // Función para refrescar permisos desde los tokens JWT
  const refreshPermissions = () => {
    setIsLoading(true);
    
    try {
      const userInfo = getCurrentUserInfo();
      
      if (userInfo) {
        setPermissions(userInfo.permissions || []);
        setRoles(userInfo.roles || []);
        setIsRootAdminState(userInfo.isRootAdmin || false);
        setIsOrgAdminState(userInfo.isOrgAdmin || false);
        
        console.log('Permissions refreshed:', {
          permissions: userInfo.permissions,
          roles: userInfo.roles,
          isRootAdmin: userInfo.isRootAdmin,
          isOrgAdmin: userInfo.isOrgAdmin,
          hasOrgAccess: userInfo.hasOrganizationAccess
        });
      } else {
        // Si no hay información del usuario, limpiar permisos
        setPermissions([]);
        setRoles([]);
        setIsRootAdminState(false);
        setIsOrgAdminState(false);
        console.log('No user info available, clearing permissions');
      }
    } catch (error) {
      console.error('Error refreshing permissions:', error);
      // En caso de error, limpiar permisos
      setPermissions([]);
      setRoles([]);
      setIsRootAdminState(false);
      setIsOrgAdminState(false);
    } finally {
      setIsLoading(false);
    }
  };

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
    // Verificar periódicamente si los tokens han cambiado
    const checkTokensInterval = setInterval(() => {
      const currentUserInfo = getCurrentUserInfo();
      
      // Comparar si los permisos han cambiado
      const currentPermissions = currentUserInfo.permissions;
      const currentRoles = currentUserInfo.roles;
      const currentIsRootAdmin = currentUserInfo.isRootAdmin;
      const currentIsOrgAdmin = currentUserInfo.isOrgAdmin;
      
      if (
        JSON.stringify(currentPermissions) !== JSON.stringify(permissions) ||
        JSON.stringify(currentRoles) !== JSON.stringify(roles) ||
        currentIsRootAdmin !== isRootAdminState ||
        currentIsOrgAdmin !== isOrgAdminState
      ) {
        console.log('Token changes detected, refreshing permissions...');
        refreshPermissions();
      }
    }, 2000); // Verificar cada 2 segundos para ser más responsivo

    return () => clearInterval(checkTokensInterval);
  }, [permissions, roles, isRootAdminState, isOrgAdminState]);

  // Escuchar cambios en localStorage (por ejemplo, logout)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' || e.key === 'organizationToken') {
        console.log('Storage change detected, refreshing permissions...');
        refreshPermissions();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Funciones de verificación que usan el estado local para mejor rendimiento
  // NOTA: isOrgAdmin hace bypass de permisos, isRootAdmin NO (solo da acceso a rutas admin)
  const checkPermission = (permission: Permission | string): boolean => {
    if (isOrgAdminState) return true;
    return permissions.includes(permission);
  };

  const checkAnyPermission = (permissionsToCheck: (Permission | string)[]): boolean => {
    if (isOrgAdminState) return true;
    return permissionsToCheck.some(permission => permissions.includes(permission));
  };

  const checkAllPermissions = (permissionsToCheck: (Permission | string)[]): boolean => {
    if (isOrgAdminState) return true;
    return permissionsToCheck.every(permission => permissions.includes(permission));
  };

  const checkRole = (roleId: string): boolean => {
    return roles.includes(roleId);
  };

  const checkAnyRole = (roleIds: string[]): boolean => {
    return roleIds.some(roleId => roles.includes(roleId));
  };

  const value: PermissionsContextType = {
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
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};