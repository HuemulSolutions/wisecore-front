import { httpClient } from '@/lib/http-client';

// Interfaces para los payloads de los JWT tokens
export interface LoginTokenPayload {
  sub: string; // user id
  email: string;
  name: string;
  last_name: string;
  is_root_admin: boolean;
  exp: number;
}

export interface OrganizationTokenPayload {
  sub: string; // user id
  email: string;
  roles: string[];
  permissions: string[];
  is_root_admin: boolean;
  exp: number;
}

// Tipos de permisos disponibles
export type PermissionAction = 'c' | 'r' | 'u' | 'd' | 'l' | 'manage';
export type PermissionResource = 
  | 'organization'
  | 'user'
  | 'assets'
  | 'folder'
  | 'context'
  | 'document_type'
  | 'docx_template'
  | 'template'
  | 'template_section'
  | 'section'
  | 'section_execution'
  | 'version'
  | 'llm_provider'
  | 'llm'
  | 'rbac';

export type Permission = `${PermissionResource}:${PermissionAction}`;

/**
 * Decodifica un JWT token sin verificar la firma (solo para extraer payload)
 */
export function decodeJWT<T = any>(token: string): T | null {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT format');
      return null;
    }
    
    const payload = parts[1];
    // Agregar padding si es necesario para base64
    const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decodedPayload = atob(paddedPayload);
    
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Verifica si un token JWT ha expirado
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload?.exp) return true;
  
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

/**
 * Obtiene la información del token de login
 */
export function getLoginTokenInfo(): LoginTokenPayload | null {
  try {
    const loginToken = httpClient.getLoginToken();
    if (!loginToken || isTokenExpired(loginToken)) {
      return null;
    }
    
    return decodeJWT<LoginTokenPayload>(loginToken);
  } catch (error) {
    console.error('Error getting login token info:', error);
    return null;
  }
}

/**
 * Obtiene la información del token de organización
 */
export function getOrganizationTokenInfo(): OrganizationTokenPayload | null {
  try {
    const orgToken = httpClient.getOrganizationToken();
    if (!orgToken || isTokenExpired(orgToken)) {
      return null;
    }
    
    return decodeJWT<OrganizationTokenPayload>(orgToken);
  } catch (error) {
    console.error('Error getting organization token info:', error);
    return null;
  }
}

/**
 * Verifica si el usuario es root admin
 */
export function isRootAdmin(): boolean {
  // Priorizar información del token de login
  const loginInfo = getLoginTokenInfo();
  if (loginInfo) {
    return loginInfo.is_root_admin;
  }
  
  // Fallback al token de organización
  const orgInfo = getOrganizationTokenInfo();
  return orgInfo?.is_root_admin || false;
}

/**
 * Obtiene todos los permisos del usuario actual
 */
export function getUserPermissions(): string[] {
  const orgInfo = getOrganizationTokenInfo();
  return orgInfo?.permissions || [];
}

/**
 * Obtiene todos los roles del usuario actual
 */
export function getUserRoles(): string[] {
  const orgInfo = getOrganizationTokenInfo();
  return orgInfo?.roles || [];
}

/**
 * Verifica si el usuario tiene un permiso específico
 */
export function hasPermission(permission: Permission | string): boolean {
  // Root admins tienen todos los permisos
  if (isRootAdmin()) {
    return true;
  }
  
  const userPermissions = getUserPermissions();
  return userPermissions.includes(permission);
}

/**
 * Verifica si el usuario tiene alguno de los permisos especificados
 */
export function hasAnyPermission(permissions: (Permission | string)[]): boolean {
  // Root admins tienen todos los permisos
  if (isRootAdmin()) {
    return true;
  }
  
  const userPermissions = getUserPermissions();
  return permissions.some(permission => userPermissions.includes(permission));
}

/**
 * Verifica si el usuario tiene todos los permisos especificados
 */
export function hasAllPermissions(permissions: (Permission | string)[]): boolean {
  // Root admins tienen todos los permisos
  if (isRootAdmin()) {
    return true;
  }
  
  const userPermissions = getUserPermissions();
  return permissions.every(permission => userPermissions.includes(permission));
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export function hasRole(roleId: string): boolean {
  const userRoles = getUserRoles();
  return userRoles.includes(roleId);
}

/**
 * Verifica si el usuario tiene alguno de los roles especificados
 */
export function hasAnyRole(roleIds: string[]): boolean {
  const userRoles = getUserRoles();
  return roleIds.some(roleId => userRoles.includes(roleId));
}

/**
 * Obtiene información completa del usuario actual
 */
export function getCurrentUserInfo() {
  try {
    const loginInfo = getLoginTokenInfo();
    const orgInfo = getOrganizationTokenInfo();
    
    return {
      loginInfo,
      orgInfo,
      isRootAdmin: isRootAdmin(),
      permissions: getUserPermissions(),
      roles: getUserRoles(),
      isAuthenticated: !!loginInfo,
      hasOrganizationAccess: !!orgInfo
    };
  } catch (error) {
    console.error('Error getting current user info:', error);
    return {
      loginInfo: null,
      orgInfo: null,
      isRootAdmin: false,
      permissions: [],
      roles: [],
      isAuthenticated: false,
      hasOrganizationAccess: false
    };
  }
}