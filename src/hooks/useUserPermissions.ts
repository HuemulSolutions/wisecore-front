import { useMemo, useRef } from 'react';
import { usePermissions } from '@/contexts/permissions-context';
import type { Permission } from '@/lib/jwt-utils';

/**
 * Hook personalizado que facilita el uso del sistema de permisos
 * Proporciona funciones optimizadas y memoizadas para verificar permisos
 */
export function useUserPermissions() {
  // Manejo seguro del contexto de permisos
  let contextData;
  try {
    contextData = usePermissions();
  } catch {
    // Si el contexto no está disponible, retornar valores por defecto
    console.warn('PermissionsContext not available, using default values');
    contextData = {
      permissions: [],
      roles: [],
      isRootAdmin: false,
      isLoading: true,
      hasPermission: () => false,
      hasAnyPermission: () => false,
      hasAllPermissions: () => false,
      hasRole: () => false,
      hasAnyRole: () => false,
      refreshPermissions: () => {},
    };
  }

  const {
    permissions,
    roles,
    isRootAdmin,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    refreshPermissions,
  } = contextData;

  const resolveResourceAliases = (resource: string): string[] => {
    if (resource === 'asset' || resource === 'assets') {
      return ['asset', 'assets'];
    }
    return [resource];
  };

  // Funciones memoizadas para diferentes tipos de verificaciones comunes
  const canCreate = useMemo(() => {
    return (resource: string) => {
      const resources = resolveResourceAliases(resource);
      const permissionsToCheck = resources.map(res => `${res}:c` as Permission);
      return hasAnyPermission(permissionsToCheck) || isRootAdmin;
    };
  }, [hasAnyPermission, isRootAdmin]);

  const canRead = useMemo(() => {
    return (resource: string) => {
      const resources = resolveResourceAliases(resource);
      const permissionsToCheck = resources.map(res => `${res}:r` as Permission);
      return hasAnyPermission(permissionsToCheck) || isRootAdmin;
    };
  }, [hasAnyPermission, isRootAdmin]);

  const canUpdate = useMemo(() => {
    return (resource: string) => {
      const resources = resolveResourceAliases(resource);
      const permissionsToCheck = resources.map(res => `${res}:u` as Permission);
      return hasAnyPermission(permissionsToCheck) || isRootAdmin;
    };
  }, [hasAnyPermission, isRootAdmin]);

  const canDelete = useMemo(() => {
    return (resource: string) => {
      const resources = resolveResourceAliases(resource);
      const permissionsToCheck = resources.map(res => `${res}:d` as Permission);
      return hasAnyPermission(permissionsToCheck) || isRootAdmin;
    };
  }, [hasAnyPermission, isRootAdmin]);

  const canList = useMemo(() => {
    return (resource: string) => {
      const resources = resolveResourceAliases(resource);
      const permissionsToCheck = resources.map(res => `${res}:l` as Permission);
      return hasAnyPermission(permissionsToCheck) || isRootAdmin;
    };
  }, [hasAnyPermission, isRootAdmin]);

  const canManage = useMemo(() => {
    return (resource: string) => {
      const resources = resolveResourceAliases(resource);
      const permissionsToCheck = resources.map(res => `${res}:manage` as Permission);
      return hasAnyPermission(permissionsToCheck) || isRootAdmin;
    };
  }, [hasAnyPermission, isRootAdmin]);

  // Verificaciones específicas para recursos comunes
  const canAccessUsers = useMemo(() => {
    return hasAnyPermission(['user:r', 'user:l', 'user:c', 'user:u', 'user:d']) || isRootAdmin;
  }, [hasAnyPermission, isRootAdmin]);

  const canAccessRoles = useMemo(() => {
    return hasAnyPermission(['rbac:r', 'rbac:manage']) || isRootAdmin;
  }, [hasAnyPermission, isRootAdmin]);

  const canAccessAssets = useMemo(() => {
    return hasAnyPermission([
      'asset:r', 'asset:l', 'asset:c', 'asset:u', 'asset:d',
      'assets:r', 'assets:l', 'assets:c', 'assets:u', 'assets:d'
    ]) || isRootAdmin;
  }, [hasAnyPermission, isRootAdmin]);

  const canAccessFolders = useMemo(() => {
    return hasAnyPermission(['folder:r', 'folder:l', 'folder:c', 'folder:u', 'folder:d']) || isRootAdmin;
  }, [hasAnyPermission, isRootAdmin]);

  const canAccessTemplates = useMemo(() => {
    return hasAnyPermission(['template:r', 'template:l', 'template:c', 'template:u', 'template:d']) || isRootAdmin;
  }, [hasAnyPermission, isRootAdmin]);

  const canAccessDocumentTypes = useMemo(() => {
    return hasAnyPermission(['document_type:r', 'document_type:l', 'document_type:c', 'document_type:u', 'document_type:d']) || isRootAdmin;
  }, [hasAnyPermission, isRootAdmin]);

  const canAccessSections = useMemo(() => {
    return hasAnyPermission(['section:r', 'section:l', 'section:c', 'section:u', 'section:d']) || isRootAdmin;
  }, [hasAnyPermission, isRootAdmin]);

  const canAccessSectionExecutions = useMemo(() => {
    return hasAnyPermission(['section_execution:r', 'section_execution:l', 'section_execution:c', 'section_execution:u', 'section_execution:d']) || isRootAdmin;
  }, [hasAnyPermission, isRootAdmin]);

  const canAccessContexts = useMemo(() => {
    return hasAnyPermission(['context:r', 'context:l', 'context:c', 'context:u', 'context:d']) || isRootAdmin;
  }, [hasAnyPermission, isRootAdmin]);

  const canAccessModels = useMemo(() => {
    return hasAnyPermission(['llm:r', 'llm:l', 'llm:c', 'llm:u', 'llm:d', 'llm_provider:r', 'llm_provider:l', 'llm_provider:c', 'llm_provider:u', 'llm_provider:d']) || isRootAdmin;
  }, [hasAnyPermission, isRootAdmin]);

  const canAccessOrganizations = useMemo(() => {
    return hasAnyPermission(['organization:r', 'organization:l', 'organization:c', 'organization:u', 'organization:d']) || isRootAdmin;
  }, [hasAnyPermission, isRootAdmin]);

  const canAccessVersions = useMemo(() => {
    return hasAnyPermission(['version:r', 'version:l', 'version:c', 'version:u', 'version:d']) || isRootAdmin;
  }, [hasAnyPermission, isRootAdmin]);

  // Función para verificar múltiples permisos de un recurso
  const hasResourceAccess = useMemo(() => {
    return (resource: string, actions: string[] = ['r']) => {
      const resources = resolveResourceAliases(resource);
      const permissionsToCheck = resources.flatMap(res =>
        actions.map(action => `${res}:${action}` as Permission)
      );
      return hasAnyPermission(permissionsToCheck) || isRootAdmin;
    };
  }, [hasAnyPermission, isRootAdmin]);

  // Función para obtener las acciones permitidas para un recurso
  const getAllowedActions = useMemo(() => {
    return (resource: string): string[] => {
      if (isRootAdmin) {
        return ['c', 'r', 'u', 'd', 'l', 'manage'];
      }

      const actions = ['c', 'r', 'u', 'd', 'l', 'manage'];
      const resources = resolveResourceAliases(resource);
      return actions.filter(action =>
        resources.some(res => hasPermission(`${res}:${action}` as Permission))
      );
    };
  }, [hasPermission, isRootAdmin]);

  // Debug info (solo en desarrollo) - con throttling para evitar spam
  const lastLogRef = useRef<string>('');
  
  if (process.env.NODE_ENV === 'development') {
    const currentState = JSON.stringify({
      isRootAdmin,
      permissionsCount: permissions.length,
      canAccessUsers,
      canAccessRoles,
      canAccessAssets,
      isLoading
    });
    
    // Solo logear cuando el estado realmente cambia
    if (currentState !== lastLogRef.current && permissions.length > 0) {
      lastLogRef.current = currentState;
      console.log('useUserPermissions state changed:', {
        isRootAdmin,
        permissionsCount: permissions.length,
        canAccessUsers,
        canAccessRoles,
        canAccessAssets,
        isLoading
      });
    }
  }

  return {
    // Estado
    permissions,
    roles,
    isRootAdmin,
    isLoading,

    // Funciones básicas
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    refreshPermissions,

    // Funciones CRUD
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canList,
    canManage,

    // Verificaciones específicas por recurso
    canAccessUsers,
    canAccessRoles,
    canAccessAssets,
    canAccessFolders,
    canAccessTemplates,
    canAccessDocumentTypes,
    canAccessSections,
    canAccessSectionExecutions,
    canAccessContexts,
    canAccessModels,
    canAccessOrganizations,
    canAccessVersions,

    // Funciones de utilidad
    hasResourceAccess,
    getAllowedActions,
  };
}
