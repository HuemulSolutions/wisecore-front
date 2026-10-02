import { toast } from 'sonner';
import { ApiError } from '@/types/api-error';
import type { HandleApiErrorOptions } from '@/types/error-utils'
export type { HandleApiErrorOptions }
import i18n from '@/i18n';
import { buildErrorReport } from '@/lib/error-report';
import { errorReportStore } from '@/lib/error-report-store';
import { logger } from '@/lib/logger';

// Sonner por defecto descarta a los 4s; no alcanza para notar y clickear
// un botón secundario como "Ver detalles".
const ERROR_TOAST_DURATION_MS = 10_000;

/** `error.code` del backend → clave i18n del mensaje que ve el usuario. */
const DEDICATED_ERROR_MESSAGES: Record<string, string> = {
  // El genérico del backend habla de "locked" sin contexto. Cubre tanto `archived`
  // como `finalized` — mismo código de error para ambos.
  EXECUTION_LIFECYCLE_LOCKED: 'assets:lifecycle.errorLocked',
  // Respaldo ante la carrera donde el usuario mandó el request justo antes de que
  // lifecycle_status refrescara con is_locked_external_elaboration: true (los botones
  // ya deberían estar apagados por computeFrontendPermissions, esto es solo el eco).
  EXECUTION_LOCKED_EXTERNAL_ELABORATION: 'assets:lifecycle.errorLockedExternalElaboration',
  // Login/SSO (docs/sso-frontend.md §2): conexión de la membresía desactivada,
  // restricción sobre el método de un root admin y organización llena.
  CONNECTION_DISABLED: 'auth:ssoErrors.connection_disabled',
  ROOT_ADMIN_METHOD_RESTRICTED: 'auth:errors.rootAdminMethodRestricted',
  ORGANIZATION_USER_LIMIT_REACHED: 'auth:errors.organizationUserLimitReached',
  // Modo administrador (docs/sso-frontend.md §2.1). `httpClient` ya pidió el código y
  // reintentó; estos mensajes solo aparecen si eso no alcanzó (p. ej. otro 403 en el
  // reintento). Si el usuario canceló, el error llega `handled` y no hay toast.
  ROOT_ELEVATION_REQUIRED: 'auth:errors.rootElevationRequired',
  ROOT_ELEVATION_EXPIRED: 'auth:errors.rootElevationExpired',
  ROOT_ELEVATION_INVALID: 'auth:errors.rootElevationExpired',
  ROOT_ADMIN_REQUIRED: 'auth:errors.rootAdminRequired',
  // Autorización (auditoría del backend, PR #355). El permiso exacto que falta queda en el
  // log (`detail`); al usuario le basta saber que no tiene acceso y a quién pedírselo.
  INSUFFICIENT_PERMISSIONS: 'auth:errors.insufficientPermissions',
  LIFECYCLE_PERMISSION_DENIED: 'assets:lifecycle.errorPermissionDenied',
  ORG_MEMBERSHIP_REQUIRED: 'auth:errors.orgMembershipRequired',
  INVALID_ORG_HEADER: 'auth:errors.invalidOrganization',
  // LLM por propósito (rerank / análisis de imágenes). La UI ya deshabilita las opciones
  // inválidas; esto es el eco si el catálogo cambió entre la carga y el clic.
  LLM_MISSING_CAPABILITY: 'models:errors.missingCapability',
  LLM_PURPOSE_REQUIRES_CAPABILITY: 'models:errors.purposeRequiresCapability',
  // Accesos de una colección: solo se puede dar acceso a roles de la organización y a sus
  // miembros. El buscador solo ofrece esos; esto es el eco de un dato que cambió entretanto.
  INVALID_COLLECTION_ACCESS: 'collections:errors.invalidAccess',
  // Nunca queda una colección sin administradores; la hoja de accesos ya lo impide.
  COLLECTION_ADMIN_REQUIRED_AT_LEAST_ONE: 'collections:errors.adminRequired',
};

/**
 * Centralized error handler for API errors
 * 
 * @param error - The error object (typically from a catch block)
 * @param options - Configuration options
 * 
 * @example
 * // Basic usage in a mutation
 * onError: (error) => {
 *   handleApiError(error);
 * }
 * 
 * @example
 * // With custom fallback message
 * onError: (error) => {
 *   handleApiError(error, { fallbackMessage: 'Failed to save changes' });
 * }
 * 
 * @example
 * // With custom error code handling
 * onError: (error) => {
 *   handleApiError(error, {
 *     onErrorCode: (code) => {
 *       if (code === 'DUPLICATE_ENTRY') {
 *         toast.warning('This item already exists');
 *         return true; // Prevent default toast
 *       }
 *       return false;
 *     }
 *   });
 * }
 */
export function handleApiError(
  error: unknown,
  options: HandleApiErrorOptions = {}
): void {
  const { 
    fallbackMessage = 'An unexpected error occurred', 
    showToast = true,
    showDescription = true,
    onErrorCode 
  } = options;

  if (ApiError.isApiError(error)) {
    // Log transaction ID for debugging/support
    logger.error(`[API Error] Transaction: ${error.transactionId}`, {
      code: error.code,
      message: error.message,
      detail: error.detail,
      path: error.path,
      statusCode: error.statusCode
    });

    // Allow custom handling based on error code
    if (onErrorCode && onErrorCode(error.code)) {
      return; // Custom handler took care of it
    }

    // Códigos con mensaje propio y traducido en vez del texto crudo del backend.
    const dedicatedMessageKey = DEDICATED_ERROR_MESSAGES[error.code];
    if (dedicatedMessageKey) {
      // `handled`: httpClient ya resolvió el caso (p. ej. el usuario canceló el código del
      // modo administrador); no se apila un toast sobre esa decisión.
      if (showToast && !error.handled) {
        toast.error(i18n.t(dedicatedMessageKey));
      }
      return;
    }

    // Solo saltar cuando httpClient ya lo manejó (logout + redirect).
    // No volver a adivinar aquí con el mismo heurístico de permisos: dos
    // copias de esa heurística fue justo lo que causó que un 401 de
    // permisos no mostrara nada (ver httpClient.fetch).
    if (error.handled) {
      return;
    }

    const report = options.showDetailsAction === false ? null : buildErrorReport(error);

    if (showToast) {
      // Con dialog de detalles el toast se queda solo con el mensaje: el
      // detail completo (que puede ser largo) se lee en el dialog. Sin
      // dialog no hay otro lugar donde mostrarlo, así que ahí sí va como
      // descripción.
      const description =
        !report && showDescription && error.detail && error.detail !== error.message
          ? error.detail
          : undefined;

      toast.error(error.message, {
        description,
        duration: report ? ERROR_TOAST_DURATION_MS : undefined,
        action: report
          ? {
              label: i18n.t('error-details:viewDetails'),
              // Sonner descarta el toast solo después de este onClick
              // (no llamamos preventDefault) — no hace falta toast.dismiss.
              onClick: () => errorReportStore.open(report),
            }
          : undefined,
      });
    }

    return;
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    logger.error('[Error]', error.message);
    
    if (showToast) {
      toast.error(error.message || fallbackMessage);
    }
    return;
  }

  // Handle unknown error types
  logger.error('[Unknown Error]', error);
  
  if (showToast) {
    toast.error(fallbackMessage);
  }
}

/**
 * Get an appropriate error message from an error object
 * Useful when you need the message but don't want to show a toast
 * 
 * @param error - The error object
 * @param fallbackMessage - Message to return if no error message is available
 * @returns The error message string
 */
export function getErrorMessage(error: unknown, fallbackMessage = 'An error occurred'): string {
  if (ApiError.isApiError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }
  
  return fallbackMessage;
}

/**
 * Check if an error is a specific API error code
 * 
 * @example
 * if (isErrorCode(error, 'NOT_FOUND')) {
 *   // Handle not found case
 * }
 */
export function isErrorCode(error: unknown, code: string): boolean {
  return ApiError.isApiError(error) && error.code === code;
}

/**
 * Check if an error is a specific HTTP status code
 * 
 * @example
 * if (isStatusCode(error, 404)) {
 *   // Handle not found case
 * }
 */
export function isStatusCode(error: unknown, statusCode: number): boolean {
  return ApiError.isApiError(error) && error.statusCode === statusCode;
}

/**
 * Recupera el `detail` estructurado que el backend mandó como objeto.
 * ApiError lo normaliza siempre a string (JSON.stringify si no era string
 * de por sí) — este helper deshace ese paso para los códigos de error que
 * traen un `detail` con forma de objeto (ej. DUPLICATE_DOCUMENT_CONTENT).
 */
export function parseErrorDetail<T>(error: unknown): T | null {
  if (!ApiError.isApiError(error) || !error.detail) return null;
  try {
    const parsed = JSON.parse(error.detail);
    return typeof parsed === 'object' && parsed !== null ? (parsed as T) : null;
  } catch {
    return null;
  }
}

/**
 * Re-export ApiError for convenience
 */
export { ApiError };
