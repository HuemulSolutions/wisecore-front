import type { ReactNode } from 'react';
import type { Permission } from '@/lib/jwt-utils';

// ==================== Form Props ====================

/**
 * Props para el formulario de login
 */
export interface LoginFormProps extends React.ComponentProps<"div"> {
  /** Callback cuando el usuario quiere cambiar a signup */
  onSwitchToSignup?: () => void;
  /** Callback cuando se solicita un código OTP con el email */
  onCodeRequested?: (email: string) => void;
}

/**
 * Props para el formulario de registro (signup)
 */
export interface SignupFormProps extends React.ComponentProps<"div"> {
  /** Callback cuando el usuario quiere cambiar a login */
  onSwitchToLogin?: () => void;
  /** Callback cuando el registro es exitoso */
  onSuccess?: () => void;
}

/**
 * Props para el formulario de verificación OTP
 */
export interface OTPFormProps extends React.ComponentProps<"div"> {
  /** Email del usuario */
  email: string;
  /** Nombre del usuario (requerido para signup) */
  name?: string;
  /** Apellido del usuario (requerido para signup) */
  lastName?: string;
  /** Propósito de la verificación (login o signup) */
  purpose: "login" | "signup";
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
 * 
 * @example
 * // Solo autenticación
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * @example
 * // Requiere permiso específico
 * <ProtectedRoute permission="user:c">
 *   <CreateUserPage />
 * </ProtectedRoute>
 * 
 * @example
 * // Solo para admins
 * <ProtectedRoute requireRootAdmin>
 *   <AdminPanel />
 * </ProtectedRoute>
 * 
 * @example
 * // Con redirección personalizada
 * <ProtectedRoute permission="assets:r" redirectTo="/dashboard">
 *   <AssetsPage />
 * </ProtectedRoute>
 */
export interface ProtectedRouteWithPermissionsProps {
  /** Contenido a renderizar si el usuario tiene los permisos necesarios */
  children: ReactNode;
  
  // Verificación por permisos específicos
  /** Permiso específico requerido */
  permission?: Permission | string;
  /** Lista de permisos, requiere al menos uno por defecto */
  permissions?: (Permission | string)[];
  /** Si es true, requiere todos los permisos de la lista */
  requireAllPermissions?: boolean;
  
  // Verificación por roles
  /** Rol específico requerido */
  role?: string;
  /** Lista de roles, requiere al menos uno por defecto */
  roles?: string[];
  /** Si es true, requiere todos los roles de la lista */
  requireAllRoles?: boolean;
  
  // Verificación por recursos
  /** Recurso sobre el que se verifican los permisos */
  resource?: string;
  /** Acción específica sobre el recurso */
  resourceAction?: 'c' | 'r' | 'u' | 'd' | 'l' | 'manage';
  /** Lista de acciones sobre el recurso, requiere al menos una */
  resourceActions?: ('c' | 'r' | 'u' | 'd' | 'l' | 'manage')[];
  
  /** Solo permite acceso a root admin */
  requireRootAdmin?: boolean;
  
  /** Página a la que redirigir si no tiene permisos (por defecto /home) */
  redirectTo?: string;
  
  /** Mostrar página de error en lugar de redirigir */
  showErrorPage?: boolean;
}

// ==================== Auth State ====================

/**
 * Estado del paso en el formulario de signup
 */
export type SignupStep = 'email' | 'details';

/**
 * Propósito de la autenticación OTP
 */
export type AuthPurpose = 'login' | 'signup';

// ==================== Acciones de recursos ====================

/**
 * Acciones disponibles sobre recursos
 * - c: Create (Crear)
 * - r: Read (Leer)
 * - u: Update (Actualizar)
 * - d: Delete (Eliminar)
 * - l: List (Listar)
 * - manage: Administrar (todos los permisos)
 */
export type ResourceAction = 'c' | 'r' | 'u' | 'd' | 'l' | 'manage';
