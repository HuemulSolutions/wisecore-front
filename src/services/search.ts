import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";


export async function search(query: string, organizationId: string) {
    const response = await httpClient.get(`${backendUrl}/search/?query=${encodeURIComponent(query)}`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    if (!response.ok) {
        throw new Error('Error performing search');
    }
    const data = await response.json();
    console.log('Search results:', data.data);
    return data.data;
}