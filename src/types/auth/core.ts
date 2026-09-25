import type { ReactNode } from 'react'
import type { Permission } from '@/types/jwt-utils'
import type { User } from '@/types/users'

// ==================== Form Props ====================

/**
 * Props para el formulario de login
 */
export interface LoginFormProps extends React.ComponentProps<"div"> {
  /** Callback cuando se solicita un código OTP con el email */
  onCodeRequested?: (email: string) => void;
}

/**
 * Props para el formulario de verificación OTP
 */
export interface OTPFormProps extends React.ComponentProps<"div"> {
  /** Email del usuario */
  email: string;
  /** Propósito de la verificación */
  purpose: "login";
  /** Callback para volver al formulario anterior */
  onBack?: () => void;
  /** Callback cuando la verificación es exitosa */
  onSuccess?: () => void;
}

// ==================== Protected Route Props ====================

/**
 * Props básicas para una ruta protegida (solo autenticación)
 */
export interface BasicProtectedRouteProps {
  /** Contenido a renderizar si el usuario está autenticado */
  children: ReactNode;
}

/**
 * Props para una ruta protegida con verificación de permisos
 */
export interface ProtectedRouteWithPermissionsProps {
  /** Contenido a renderizar si el usuario tiene los permisos necesarios */
  children: ReactNode;

  permission?: Permission | string;
  permissions?: (Permission | string)[];
  requireAllPermissions?: boolean;

  role?: string;
  roles?: string[];
  requireAllRoles?: boolean;

  resource?: string;
  resourceAction?: 'c' | 'r' | 'u' | 'd' | 'l' | 'manage';
  resourceActions?: ('c' | 'r' | 'u' | 'd' | 'l' | 'manage')[];

  requireRootAdmin?: boolean;
  redirectTo?: string;
  showErrorPage?: boolean;
}

// ==================== Auth State ====================

export type AuthPurpose = 'login';

export type ResourceAction = 'c' | 'r' | 'u' | 'd' | 'l' | 'manage';

// ==================== Service Auth Types ====================

export interface RequestCodeRequest {
  email: string;
  purpose: 'login';
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface UpdateUserRequest {
  name: string;
  last_name: string;
  birthdate?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
