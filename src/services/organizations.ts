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

export async function addOrganization({ name, description }: { name: string; description?: string }) {
  const response = await fetch(`${backendUrl}/organizations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description: description || null,
    }),
  });

  if (!response.ok) {
    throw new Error('Error creating organization');
  }

  const data = await response.json();
  console.log('Organization created:', data.data);
  return data.data;
}