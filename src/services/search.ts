import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";


export async function search(query: string, organizationId: string) {
    const response = await httpClient.get(`${backendUrl}/search/?query=${encodeURIComponent(query)}`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    console.log('Search results:', data.data);
    return data.data;
}
