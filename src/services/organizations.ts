import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

export async function getUserOrganizations(userId: string) {
  console.log('getUserOrganizations called for userId:', userId);
  console.log('Current httpClient tokens state:', httpClient.getTokensState());
  console.log('Current localStorage state:', httpClient.getLocalStorageState());
  
  const response = await httpClient.get(`${backendUrl}/users/organizations?user_id=${userId}`);
  const data = await response.json();
  console.log('User organizations fetched:', data.data);
  return data.data;
}

export async function generateOrganizationToken(organizationId: string) {
  const response = await httpClient.post(`${backendUrl}/user_roles/user_token`, null, {
    headers: {
      'X-Org-Id': organizationId
    }
  });

  const data = await response.json();
  console.log('Organization token generated:', data);
  return data;
}

export async function getAllOrganizations(page = 1, pageSize = 10) {
  const response = await httpClient.get(`${backendUrl}/organizations?page=${page}&page_size=${pageSize}`);
  const data = await response.json();
  console.log('Organizations fetched:', data);
  return data;
}

export async function addOrganization({ name, description }: { name: string; description?: string }) {
  const response = await httpClient.post(`${backendUrl}/organizations`, {
    name,
    description: description || null,
  });

  const data = await response.json();
  console.log('Organization created:', data.data);
  return data.data;
}

export async function updateOrganization(
  organizationId: string, 
  { name, description, max_users, token_limit }: { 
    name: string; 
    description?: string;
    max_users?: number | null;
    token_limit?: number | null;
  }
) {
  const body: Record<string, unknown> = {
    name,
    description: description || null,
  };

  // Solo incluir max_users y token_limit si están definidos
  if (max_users !== undefined) {
    body.max_users = max_users;
  }
  if (token_limit !== undefined) {
    body.token_limit = token_limit;
  }

  const response = await httpClient.patch(`${backendUrl}/organizations/${organizationId}`, body);

  const data = await response.json();
  console.log('Organization updated:', data.data);
  return data.data;
}

export async function deleteOrganization(organizationId: string) {
  await httpClient.delete(`${backendUrl}/organizations/${organizationId}`);
  console.log('Organization deleted:', organizationId);
}
