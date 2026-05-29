import type { ReactNode } from 'react'
import type { Permission } from '@/lib/jwt-utils'

export interface PermissionsContextType {
  permissions: string[];
  roles: string[];
  isRootAdmin: boolean;
  isOrgAdmin: boolean;
  isLoading: boolean;
  hasPermission: (permission: Permission | string) => boolean;
  hasAnyPermission: (permissions: (Permission | string)[]) => boolean;
  hasAllPermissions: (permissions: (Permission | string)[]) => boolean;
  hasRole: (roleId: string) => boolean;
  hasAnyRole: (roleIds: string[]) => boolean;
  refreshPermissions: (forceClean?: boolean) => void;
}

export interface PermissionsProviderProps {
  children: ReactNode;
}
