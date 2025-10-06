import { backendUrl } from "@/config";


export async function search(query: string, organizationId: string) {
    const response = await fetch(`${backendUrl}/chunks/search?query=${encodeURIComponent(query)}`, {
        headers: {
            'OrganizationId': organizationId,
        },
    });
    if (!response.ok) {
        throw new Error('Error performing search');
    }
    const data = await response.json();
    console.log('Search results:', data.data);
    return data.data;
}