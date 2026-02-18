import { backendUrl } from '@/config';
import { httpClient } from '@/lib/http-client';

export interface AuthType {
  id: string;
  name: string;
  type: 'internal' | 'entra';
  params: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAuthTypeRequest {
  name: string;
  type: 'internal' | 'entra';
  params?: Record<string, unknown> | null;
}

export interface UpdateAuthTypeRequest {
  name: string;
  type: 'internal' | 'entra';
  params?: Record<string, unknown> | null;
}

export interface AuthTypesResponse {
  data: AuthType[];
  transaction_id: string;
  timestamp: string;
}

export interface AuthTypeResponse {
  data: AuthType;
  transaction_id: string;
  timestamp: string;
}

export interface AuthTypeTypesResponse {
  data: string[];
  transaction_id: string;
  timestamp: string;
}

class AuthTypesService {
  private baseUrl = `${backendUrl}/auth_types`;

  async getAuthTypes(): Promise<AuthType[]> {
    const response = await httpClient.get(`${this.baseUrl}/`);
    const data: AuthTypesResponse = await response.json();
    return data.data;
  }

  async getAuthType(id: string): Promise<AuthType> {
    const response = await httpClient.get(`${this.baseUrl}/${id}`);
    const data: AuthTypeResponse = await response.json();
    return data.data;
  }

  async getAuthTypeTypes(): Promise<string[]> {
    const response = await httpClient.get(`${this.baseUrl}/types`);
    const data: AuthTypeTypesResponse = await response.json();
    return data.data;
  }

  async createAuthType(data: CreateAuthTypeRequest): Promise<AuthType> {
    const response = await httpClient.post(`${this.baseUrl}/`, data);
    const result: AuthTypeResponse = await response.json();
    return result.data;
  }

  async updateAuthType(id: string, data: UpdateAuthTypeRequest): Promise<AuthType> {
    const response = await httpClient.put(`${this.baseUrl}/${id}`, data);
    const result: AuthTypeResponse = await response.json();
    return result.data;
  }

  async deleteAuthType(id: string): Promise<void> {
    await httpClient.delete(`${this.baseUrl}/${id}`);
  }
}

export const authTypesService = new AuthTypesService();

// Export individual functions for use in hooks
export const getAuthTypes = () => authTypesService.getAuthTypes();
export const getAuthType = (id: string) => authTypesService.getAuthType(id);
export const getAuthTypeTypes = () => authTypesService.getAuthTypeTypes();
export const createAuthType = (data: CreateAuthTypeRequest) => authTypesService.createAuthType(data);
export const updateAuthType = (id: string, data: UpdateAuthTypeRequest) => authTypesService.updateAuthType(id, data);
export const deleteAuthType = (id: string) => authTypesService.deleteAuthType(id);
