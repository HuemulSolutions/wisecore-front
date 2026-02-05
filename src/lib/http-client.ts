import { ApiError } from '@/types/api-error';

let loginToken: string | null = null;
let organizationToken: string | null = null;
let organizationId: string | null = null;
let onUnauthorized: (() => void) | null = null;

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

  setOnUnauthorized(callback: () => void) {
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
    const headers = new Headers(options.headers);
    
    // Determinar qué token usar basado en la URL
    const isTokenEndpoint = url.includes('/users/') && url.includes('/token');
    const isUserRolesTokenEndpoint = url.includes('/user_roles/user_token');
    const isUserOrganizationsEndpoint = url.includes('/users/organizations');
    const isAuthEndpoint = url.includes('/auth/');
    const isOrganizationsEndpoint = url.includes('/organizations') && !url.includes('/users/organizations');
    
    // Usar loginToken para:
    // 1. Generar token organizacional (/users/{id}/token)
    // 2. Generar token de usuario-rol (/user_roles/user_token)
    // 3. Obtener organizaciones del usuario (/users/organizations) 
    // 4. Endpoints de auth (/auth/*)
    // 5. Listar todas las organizaciones (/organizations)
    const shouldUseLoginToken = isTokenEndpoint || isUserRolesTokenEndpoint || isUserOrganizationsEndpoint || isAuthEndpoint || isOrganizationsEndpoint;
    const tokenToUse = shouldUseLoginToken ? loginToken : organizationToken;
    
    console.log(`[httpClient] ${options.method || 'GET'} ${url}`);
    console.log(`[httpClient] Using ${shouldUseLoginToken ? 'login' : 'organization'} token:`, tokenToUse?.substring(0, 10) + '...');
    
    // Add auth token if available
    if (tokenToUse) {
      headers.set('Authorization', `Bearer ${tokenToUse}`);
    }

    // Add organization ID if available 
    // (no incluir para endpoints de auth, pero sí para endpoints de token y otros)
    if (organizationId && !isAuthEndpoint) {
      headers.set('X-Org-Id', organizationId);
      console.log(`[httpClient] Using organization ID:`, organizationId);
    }

    // Ensure Content-Type is set for requests with body (except FormData)
    if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
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
        console.error(`[API Error] Transaction ID: ${apiError.transactionId}`, {
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
            onUnauthorized();
          }
        }

        throw apiError;
      }

      // Fallback for non-standard error responses (shouldn't happen with new backend)
      console.warn('[httpClient] Received non-standard error response:', errorData);
      
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
          onUnauthorized();
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
