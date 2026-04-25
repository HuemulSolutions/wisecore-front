import { useMemo } from 'react';
import { usePermissions } from '@/contexts/permissions-context';
import type { Permission } from '@/lib/jwt-utils';

/**
 * Hook personalizado que facilita el uso del sistema de permisos
 * Proporciona funciones optimizadas y memoizadas para verificar permisos
 * 
 * NOTA: isOrgAdmin hace bypass de permisos dentro de la organización.
 * isRootAdmin NO hace bypass de permisos, solo da acceso a rutas administrativas técnicas.
 */
export function useUserPermissions() {
  // Manejo seguro del contexto de permisos
  let contextData;
  try {
    contextData = usePermissions();
  } catch {
    // Context not available (e.g. Plate editor portals outside the provider tree).
    // Return safe defaults with isLoading:false so consumers don't block rendering.
    contextData = {
      permissions: [],
      roles: [],
      isRootAdmin: false,
      isOrgAdmin: false,
      isLoading: false,
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
    isOrgAdmin,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    refreshPermissions,
  } = contextData;

  // Funciones memoizadas para diferentes tipos de verificaciones comunes
  // NOTA: isOrgAdmin hace bypass, isRootAdmin NO
  const canCreate = useMemo(() => {
    return (resource: string) => {
      return hasPermission(`${resource}:c` as Permission) || isOrgAdmin;
    };
  }, [hasPermission, isOrgAdmin]);

  const canRead = useMemo(() => {
    return (resource: string) => {
      return hasPermission(`${resource}:r` as Permission) || isOrgAdmin;
    };
  }, [hasPermission, isOrgAdmin]);

  const canUpdate = useMemo(() => {
    return (resource: string) => {
      return hasPermission(`${resource}:u` as Permission) || isOrgAdmin;
    };
  }, [hasPermission, isOrgAdmin]);

  const canDelete = useMemo(() => {
    return (resource: string) => {
      return hasPermission(`${resource}:d` as Permission) || isOrgAdmin;
    };
  }, [hasPermission, isOrgAdmin]);

  const canList = useMemo(() => {
    return (resource: string) => {
      return hasPermission(`${resource}:l` as Permission) || isOrgAdmin;
    };
  }, [hasPermission, isOrgAdmin]);

  // Verificaciones específicas para recursos comunes
  // NOTA: isOrgAdmin hace bypass, isRootAdmin NO
  const canAccessUsers = useMemo(() => {
    return hasAnyPermission(['user:r', 'user:l', 'user:c', 'user:u', 'user:d']) || isOrgAdmin;
  }, [hasAnyPermission, isOrgAdmin]);

  const canAccessRoles = useMemo(() => {
    return hasAnyPermission(['rbac:r', 'rbac:l', 'rbac:c', 'rbac:u', 'rbac:d']) || isOrgAdmin;
  }, [hasAnyPermission, isOrgAdmin]);

  const canAccessAssets = useMemo(() => {
    return hasAnyPermission([
      'asset:r', 'asset:l', 'asset:c', 'asset:u', 'asset:d'
    ]) || isOrgAdmin;
  }, [hasAnyPermission, isOrgAdmin]);

  const canAccessFolders = useMemo(() => {
    return hasAnyPermission(['folder:r', 'folder:l', 'folder:c', 'folder:u', 'folder:d']) || isOrgAdmin;
  }, [hasAnyPermission, isOrgAdmin]);

  const canAccessTemplates = useMemo(() => {
    return hasAnyPermission(['template:r', 'template:l', 'template:c', 'template:u', 'template:d']) || isOrgAdmin;
  }, [hasAnyPermission, isOrgAdmin]);

  const canAccessDocumentTypes = useMemo(() => {
    return hasAnyPermission(['asset_type:r', 'asset_type:l', 'asset_type:c', 'asset_type:u', 'asset_type:d']) || isOrgAdmin;
  }, [hasAnyPermission, isOrgAdmin]);

  const canAccessSections = useMemo(() => {
    return hasAnyPermission(['section:r', 'section:l', 'section:c', 'section:u', 'section:d']) || isOrgAdmin;
  }, [hasAnyPermission, isOrgAdmin]);

  const canAccessSectionExecutions = useMemo(() => {
    return hasAnyPermission(['section_execution:r', 'section_execution:l', 'section_execution:c', 'section_execution:u', 'section_execution:d']) || isOrgAdmin;
  }, [hasAnyPermission, isOrgAdmin]);

  const canAccessContexts = useMemo(() => {
    return hasAnyPermission(['context:r', 'context:l', 'context:c', 'context:u', 'context:d']) || isOrgAdmin;
  }, [hasAnyPermission, isOrgAdmin]);

  const canAccessModels = useMemo(() => {
    return hasAnyPermission(['llm:r', 'llm:l', 'llm:c', 'llm:u', 'llm:d', 'llm_provider:r', 'llm_provider:l', 'llm_provider:c', 'llm_provider:u', 'llm_provider:d']) || isOrgAdmin;
  }, [hasAnyPermission, isOrgAdmin]);

  const canAccessOrganizations = useMemo(() => {
    return hasAnyPermission(['organization:r', 'organization:l', 'organization:c', 'organization:u', 'organization:d']) || isOrgAdmin;
  }, [hasAnyPermission, isOrgAdmin]);

  const canAccessVersions = useMemo(() => {
    return hasAnyPermission(['version:r', 'version:l', 'version:c', 'version:u', 'version:d']) || isOrgAdmin;
  }, [hasAnyPermission, isOrgAdmin]);

  const canAccessDiscussions = useMemo(() => {
    return hasAnyPermission(['discussion:r', 'discussion:l', 'discussion:c', 'discussion:u', 'discussion:d']) || isOrgAdmin;
  }, [hasAnyPermission, isOrgAdmin]);

  const canAccessExternalSystems = useMemo(() => {
    return hasAnyPermission(['external_system:r', 'external_system:l', 'external_system:c', 'external_system:u', 'external_system:d']) || isOrgAdmin;
  }, [hasAnyPermission, isOrgAdmin]);

  const canAccessExternalFunctionalities = useMemo(() => {
    return hasAnyPermission(['external_functionality:r', 'external_functionality:l', 'external_functionality:c', 'external_functionality:u', 'external_functionality:d']) || isOrgAdmin;
  }, [hasAnyPermission, isOrgAdmin]);

  const canAccessExternalParameters = useMemo(() => {
    return hasAnyPermission(['external_parameter:r', 'external_parameter:l', 'external_parameter:c', 'external_parameter:u', 'external_parameter:d']) || isOrgAdmin;
  }, [hasAnyPermission, isOrgAdmin]);

  const canAccessExternalSecrets = useMemo(() => {
    return hasAnyPermission(['external_secret:r', 'external_secret:l', 'external_secret:c', 'external_secret:u', 'external_secret:d']) || isOrgAdmin;
  }, [hasAnyPermission, isOrgAdmin]);

  // Función para verificar múltiples permisos de un recurso
  const hasResourceAccess = useMemo(() => {
    return (resource: string, actions: string[] = ['r']) => {
      const permissionsToCheck = actions.map(action => `${resource}:${action}` as Permission);
      return hasAnyPermission(permissionsToCheck) || isOrgAdmin;
    };
  }, [hasAnyPermission, isOrgAdmin]);

  // Función para obtener las acciones permitidas para un recurso
  const getAllowedActions = useMemo(() => {
    return (resource: string): string[] => {
      // isOrgAdmin tiene todas las acciones
      if (isOrgAdmin) {
        return ['c', 'r', 'u', 'd', 'l'];
      }

      const actions = ['c', 'r', 'u', 'd', 'l'];
      return actions.filter(action =>
        hasPermission(`${resource}:${action}` as Permission)
      );
    };
  }, [hasPermission, isOrgAdmin]);

  return {
    // Estado
    permissions,
    roles,
    isRootAdmin,
    isOrgAdmin,
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
    canAccessDiscussions,
    canAccessExternalSystems,
    canAccessExternalFunctionalities,
    canAccessExternalParameters,
    canAccessExternalSecrets,

    // Funciones de utilidad
    hasResourceAccess,
    getAllowedActions,
  };
}
