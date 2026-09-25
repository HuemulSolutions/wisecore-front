import type { ReactNode } from 'react'
import type { Permission } from '@/lib/jwt-utils'

export interface PermissionsContextType {
  permissions: string[];
  roles: string[];
  isRootAdmin: boolean;
  isOrgAdmin: boolean;
  isLoading: boolean;
  /** True once refreshPermissions() has resolved at least one valid (non-empty) read.
   *  Lets route guards distinguish "still loading" from "loaded and genuinely empty". */
  hasLoadedPermissionsOnce: boolean;
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
