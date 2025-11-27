let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const httpClient = {
  setAuthToken(token: string | null) {
    authToken = token;
  },

  getAuthToken(): string | null {
    return authToken;
  },

  setOnUnauthorized(callback: () => void) {
    onUnauthorized = callback;
  },

  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers);
    
    // Add auth token if available
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }

    // Ensure Content-Type is set for requests with body
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle unauthorized responses
    if (response.status === 401 && onUnauthorized) {
      onUnauthorized();
    }

    return response;
  },

  // Convenience methods
  async get(url: string, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: 'GET' });
  },

  async post(url: string, body?: any, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  async put(url: string, body?: any, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  async delete(url: string, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: 'DELETE' });
  },

  async patch(url: string, body?: any, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
};