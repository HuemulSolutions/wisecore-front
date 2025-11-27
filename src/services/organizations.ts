import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

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