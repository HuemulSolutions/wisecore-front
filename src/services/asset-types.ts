import { httpClient } from '@/lib/http-client';
import { backendUrl } from '@/config';

export interface AssetType {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  assets_count?: number;
}

export interface AssetTypesResponse {
  data: AssetType[];
  transaction_id: string;
  timestamp: string;
}

export interface CreateAssetTypeData {
  name: string;
  description: string;
}

export interface UpdateAssetTypeData {
  name?: string;
  description?: string;
}

// Get current organization ID from localStorage or context
const getOrganizationId = (): string | null => {
  return localStorage.getItem('selectedOrganizationId');
};

// Get headers with organization ID
const getHeaders = (): Record<string, string> => {
  const orgId = getOrganizationId();
  const headers: Record<string, string> = {};
  
  if (orgId) {
    headers['X-Org-Id'] = orgId;
  }
  
  return headers;
};

// Get all asset types
export const getAssetTypes = async (): Promise<AssetTypesResponse> => {
  const response = await httpClient.get(`${backendUrl}/asset-types`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch asset types');
  }
  
  return response.json();
};

// Get single asset type
export const getAssetType = async (id: string): Promise<AssetType> => {
  const response = await httpClient.get(`${backendUrl}/asset-types/${id}`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch asset type');
  }
  
  return response.json();
};

// Create new asset type
export const createAssetType = async (data: CreateAssetTypeData): Promise<AssetType> => {
  const response = await httpClient.post(`${backendUrl}/asset-types`, data, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create asset type');
  }
  
  return response.json();
};

// Update asset type
export const updateAssetType = async (id: string, data: UpdateAssetTypeData): Promise<AssetType> => {
  const response = await httpClient.put(`${backendUrl}/asset-types/${id}`, data, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update asset type');
  }
  
  return response.json();
};

// Delete asset type
export const deleteAssetType = async (id: string): Promise<void> => {
  const response = await httpClient.delete(`${backendUrl}/asset-types/${id}`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete asset type');
  }
};