import { ApiError } from '@/types/api-error';
import { logger } from '@/lib/logger';
// Ciclo inocuo (jwt-utils importa httpClient): solo se usa dentro de funciones, nunca al cargar.
import { isRootAdmin } from '@/lib/jwt-utils';
import {
  ROOT_ELEVATION_HEADER,
  rootElevationStore,
  type RootElevationReason,
} from '@/lib/root-elevation-store';

// AuthProvider/OrganizationProvider restauran estos tokens en useEffect, que
// corre después del primer commit; jwt-utils los lee de forma síncrona (en el
// primer render) para calcular permisos. Sin esta hidratación, ese primer
// render ve una sesión "vacía" y dispara redirects espurios (ver
// permissions-context.tsx). Hidratar acá desde localStorage evita la carrera.
function readStored(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

const storedOrgToken = readStored('organizationToken');
const storedOrgId = readStored('selectedOrganizationId');
// Sólo se considera válida la org cuando están AMBOS, igual que el restore
// de OrganizationProvider — así httpClient y el contexto nunca discrepan.
const hasStoredOrg = !!storedOrgToken && !!storedOrgId;

let loginToken: string | null = readStored('auth_token');
let organizationToken: string | null = hasStoredOrg ? storedOrgToken : null;
let organizationId: string | null = hasStoredOrg ? storedOrgId : null;
/** Por qué se cierra la sesión: token vencido/inválido (401) o usuario ya no activo. */
export type SessionEndReason = 'expired' | 'inactive';

let onUnauthorized: ((reason: SessionEndReason) => void) | null = null;

/**
 * 403 del modo administrador que se resuelven pidiendo el código y reintentando
 * (docs/sso-frontend.md §2.1). `ROOT_ADMIN_REQUIRED` no está: el usuario ya no es root
 * y un código no lo arregla.
 */
const ROOT_ELEVATION_RETRY_REASONS: Record<string, RootElevationReason> = {
  ROOT_ELEVATION_REQUIRED: 'required',
  ROOT_ELEVATION_EXPIRED: 'expired',
  ROOT_ELEVATION_INVALID: 'expired',
};
const ROOT_ELEVATION_ENDPOINT = '/auth/root-elevation/';

export const httpClient = {
  setLoginToken(token: string | null) {
    loginToken = token;
  },

  getLoginToken(): string | null {
    return loginToken;
  },

  setOrganizationToken(token: string | null) {
    organizationToken = token;
  },

  getOrganizationToken(): string | null {
    return organizationToken;
  },

  setOrganizationId(orgId: string | null) {
    organizationId = orgId;
  },

  getOrganizationId(): string | null {
    return organizationId;
  },

  setOnUnauthorized(callback: (reason: SessionEndReason) => void) {
    onUnauthorized = callback;
  },

  // Método de compatibilidad hacia atrás
  setAuthToken(token: string | null) {
    this.setLoginToken(token);
  },

  getAuthToken(): string | null {
    return this.getLoginToken();
  },

  // Helper para depuración
  getTokensState() {
    return {
      loginToken: loginToken?.substring(0, 10) + '...' || null,
      organizationToken: organizationToken?.substring(0, 10) + '...' || null,
      organizationId: organizationId
    };
  },

  // Helper para depuración - ver localStorage
  getLocalStorageState() {
    const authToken = localStorage.getItem('auth_token');
    const orgToken = localStorage.getItem('organizationToken');
    return {
      authToken: authToken?.substring(0, 10) + '...' || null,
      organizationToken: orgToken?.substring(0, 10) + '...' || null,
      selectedOrganizationId: localStorage.getItem('selectedOrganizationId')
    };
  },

  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    return send(url, options, false);
  },

  // Convenience methods
  async get(url: string, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: 'GET' });
  },

  async post(url: string, body?: unknown, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  async put(url: string, body?: unknown, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  async delete(url: string, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: 'DELETE' });
  },

  async patch(url: string, body?: unknown, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
};

/**
 * Una request. `isRetry` marca el reintento tras verificar el código del modo
 * administrador: nunca se reintenta dos veces.
 */
async function send(url: string, options: RequestInit, isRetry: boolean): Promise<Response> {
  const headers = new Headers(options.headers);
  // La sesión con la que sale la request: un 403 que vuelve después de un logout/login
  // no debe pedirle el código a otra persona ni repetir la acción con sus credenciales.
  const sentBy = loginToken;
  
  // Determinar qué token usar basado en la URL
  const isTokenEndpoint = url.includes('/users/') && url.includes('/token');
  const isUserRolesTokenEndpoint = url.includes('/user_roles/user_token');
  const isUserOrganizationsEndpoint = url.includes('/users/organizations');
  // OJO: `/auth-sso/` y `/auth_types/` NO matchean a propósito — necesitan el token de
  // organización porque el backend lee `is_org_admin` de ese JWT (docs/sso-frontend.md).
  const isAuthEndpoint = url.includes('/auth/');
  // `/organizations/{org activa}/...` va con el token de esa organización: el backend
  // autoriza al org admin por `is_org_admin`, que solo viaja ahí. Las acciones de root no
  // dependen del token elegido: las habilita `X-Root-Elevation` (modo administrador).
  const organizationPathId = url.match(/\/organizations\/([^/?#]+)/)?.[1];
  const isActiveOrganizationEndpoint =
    !!organizationToken && !!organizationPathId && organizationPathId === organizationId;
  const isOrganizationsEndpoint =
    url.includes('/organizations') && !url.includes('/users/organizations') && !isActiveOrganizationEndpoint;

  // Usar loginToken para:
  // 1. Generar token organizacional (/users/{id}/token)
  // 2. Generar token de usuario-rol (/user_roles/user_token)
  // 3. Obtener organizaciones del usuario (/users/organizations)
  // 4. Endpoints de auth (/auth/*)
  // 5. Listar organizaciones (/organizations) y operar sobre otra organización que la
  //    activa (root admin cross-org)
  const shouldUseLoginToken = isTokenEndpoint || isUserRolesTokenEndpoint || isUserOrganizationsEndpoint || isAuthEndpoint || isOrganizationsEndpoint;
  // Use organizationToken for org-scoped requests, but fallback to loginToken if not available
  // This allows root admin to access Global Admin without selecting an organization
  const tokenToUse = shouldUseLoginToken ? loginToken : (organizationToken || loginToken);
  
  logger.log(`[httpClient] ${options.method || 'GET'} ${url}`);
  logger.log(`[httpClient] Using ${shouldUseLoginToken ? 'login' : 'organization'} token:`, tokenToUse?.substring(0, 10) + '...');
  
  // Add auth token if available. Un servicio puede forzar otro token pasando
  // `Authorization` explícito.
  if (tokenToUse && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${tokenToUse}`);
  }

  // Add organization ID if available 
  // (no incluir para endpoints de auth, pero sí para endpoints de token y otros)
  // IMPORTANTE: No sobrescribir si el servicio ya pasó un X-Org-Id específico
  // (permite a servicios consultar organizaciones diferentes a la seleccionada)
  if (organizationId && !isAuthEndpoint && !headers.has('X-Org-Id')) {
    headers.set('X-Org-Id', organizationId);
    logger.log(`[httpClient] Using organization ID:`, organizationId);
  }

  // Ensure Content-Type is set for requests with body (except FormData)
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Modo administrador: mientras haya un token vigente viaja en toda request, como
  // `X-Org-Id`. El backend lo ignora donde no aplica y el store nunca lo entrega vencido.
  const elevationToken = rootElevationStore.getToken();
  if (elevationToken && !headers.has(ROOT_ELEVATION_HEADER)) {
    headers.set(ROOT_ELEVATION_HEADER, elevationToken);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle error responses with the new standardized format
  if (!response.ok) {
    let errorData: unknown;
    
    try {
      const responseClone = response.clone();
      errorData = await responseClone.json();
    } catch {
      // If we can't parse JSON, throw a generic error
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    // Check if the response matches the new standardized error format
    if (ApiError.isApiErrorResponse(errorData)) {
      const apiError = new ApiError(errorData);
      
      // Log transaction_id for debugging
      logger.error(`[API Error] Transaction ID: ${apiError.transactionId}`, {
        code: apiError.code,
        message: apiError.message,
        detail: apiError.detail,
        path: apiError.path,
        statusCode: apiError.statusCode
      });

      // Handle 401 specifically - only logout for token issues, not permission issues
      if (response.status === 401 && onUnauthorized) {
        const isRolePermissionError =
          apiError.code === 'FORBIDDEN' ||
          apiError.code === 'INSUFFICIENT_PERMISSIONS' ||
          apiError.detail.includes('no tiene ningún rol') ||
          apiError.detail.includes('no permission') ||
          apiError.detail.includes('insufficient privileges') ||
          apiError.detail.includes('access denied');

        if (!isRolePermissionError) {
          onUnauthorized('expired');
          // Marca que este error ya disparó logout/redirect, para que
          // error-utils no intente mostrar un toast sobre algo que ya
          // está siendo manejado (ver handleApiError).
          apiError.handled = true;
        }
      }

      // Un usuario desactivado o pendiente ya no obtiene token de ninguna
      // organización (POST /user_roles/user_token): la sesión no sirve y se
      // cierra como un token vencido, con su propio mensaje.
      if (response.status === 403 && apiError.code === 'USER_NOT_ACTIVE' && onUnauthorized) {
        onUnauthorized('inactive');
        apiError.handled = true;
      }

      // Un 403 del modo administrador solo descarta el token que llevaba esta request: una
      // respuesta atrasada (token anterior u otra sesión) no borra el modo vigente.
      const sentElevation = headers.get(ROOT_ELEVATION_HEADER);
      if (response.status === 403 && apiError.code === 'ROOT_ADMIN_REQUIRED') {
        rootElevationStore.discard(sentElevation);
      }

      const elevationReason = response.status === 403 ? ROOT_ELEVATION_RETRY_REASONS[apiError.code] : undefined;
      if (elevationReason) {
        return retryWithRootElevation(url, options, isRetry, apiError, elevationReason, sentElevation, sentBy);
      }

      throw apiError;
    }

    // Fallback for non-standard error responses (shouldn't happen with new backend)
    logger.warn('[httpClient] Received non-standard error response:', errorData);
    
    // Handle 401 for legacy error format
    if (response.status === 401 && onUnauthorized) {
      const legacyData = errorData as Record<string, unknown>;
      const detail = typeof legacyData?.detail === 'string' ? legacyData.detail : '';
      
      const isRolePermissionError = 
        detail.includes('no tiene ningún rol') ||
        detail.includes('no permission') ||
        detail.includes('insufficient privileges') ||
        detail.includes('access denied');
      
      if (!isRolePermissionError) {
        onUnauthorized('expired');
      }
    }

    // Create a generic error from legacy response
    const legacyData = errorData as Record<string, unknown>;
    const message = 
      (typeof legacyData?.message === 'string' ? legacyData.message : null) ||
      (typeof legacyData?.detail === 'string' ? legacyData.detail : null) ||
      (typeof legacyData?.error === 'string' ? legacyData.error : null) ||
      `HTTP Error ${response.status}`;
    
    throw new Error(message);
  }

  return response;
}

/**
 * 403 de elevación: pide el código (un solo diálogo aunque fallen varias requests a la
 * vez) y repite la misma request una vez con el token nuevo. Si el usuario cancela,
 * el error sale marcado `handled` para no apilar un toast sobre su propia decisión.
 *
 * Solo dentro de la misma sesión que envió la request (`sentBy`): si entre el envío y
 * la respuesta, o mientras el diálogo está abierto, se cerró la sesión o entró otra
 * persona, el error se lanza tal cual. Cambiar de organización no cuenta: es el mismo
 * usuario (el login token no cambia).
 */
async function retryWithRootElevation(
  url: string,
  options: RequestInit,
  isRetry: boolean,
  apiError: ApiError,
  reason: RootElevationReason,
  sentToken: string | null,
  sentBy: string | null,
): Promise<Response> {
  const sameSession = () => loginToken === sentBy;
  if (!sameSession()) throw apiError;
  rootElevationStore.discard(sentToken);
  if (isRetry || url.includes(ROOT_ELEVATION_ENDPOINT) || !isRootAdmin()) {
    throw apiError;
  }
  // Otra request ya consiguió un token mientras esta viajaba: se reintenta sin preguntar.
  const current = rootElevationStore.getToken();
  if (current && current !== sentToken) {
    return send(url, options, true);
  }
  const elevated = await rootElevationStore.requestElevation(reason);
  if (!elevated) {
    apiError.handled = true;
    throw apiError;
  }
  if (!sameSession()) throw apiError;
  return send(url, options, true);
}
