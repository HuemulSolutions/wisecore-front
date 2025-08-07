import { backendUrl } from "@/config";

export async function getAllOrganizations() {
  const response = await fetch(`${backendUrl}/organizations`);
  if (!response.ok) {
    throw new Error('Error fetching organizations');
  }
  const data = await response.json();
  console.log('Organizations fetched:', data.data);
  return data.data;
}