import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

export async function getUserOrganizations(userId: string) {
  console.log('getUserOrganizations called for userId:', userId);
  console.log('Current httpClient tokens state:', httpClient.getTokensState());
  console.log('Current localStorage state:', httpClient.getLocalStorageState());
  
  const response = await httpClient.get(`${backendUrl}/users/organizations?user_id=${userId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Error fetching user organizations:', response.status, errorData);
    throw new Error('Error fetching user organizations');
  }
  const data = await response.json();
  console.log('User organizations fetched:', data.data);
  return data.data;
}

export async function generateOrganizationToken(userId: string, organizationId: string) {
  // Temporalmente configuramos el organization ID para esta request específica
  const currentOrgId = httpClient.getOrganizationId();
  httpClient.setOrganizationId(organizationId);
  
  try {
    const response = await httpClient.post(`${backendUrl}/users/${userId}/token`);

    if (!response.ok) {
      throw new Error('Error generating organization token');
    }

    const data = await response.json();
    console.log('Organization token generated:', data);
    return data;
  } finally {
    // Restauramos el organization ID anterior
    httpClient.setOrganizationId(currentOrgId);
  }
}

export async function getAllOrganizations() {
  const response = await httpClient.get(`${backendUrl}/organizations`);
  if (!response.ok) {
    throw new Error('Error fetching organizations');
  }
  const data = await response.json();
  console.log('Organizations fetched:', data.data);
  return data.data;
}

export async function addOrganization({ name, description }: { name: string; description?: string }) {
  const response = await httpClient.post(`${backendUrl}/organizations`, {
    name,
    description: description || null,
  });

  if (!response.ok) {
    throw new Error('Error creating organization');
  }

  const data = await response.json();
  console.log('Organization created:', data.data);
  return data.data;
}