import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";


export async function getAllDocumentTypes(organizationId: string) {
    const url = `${backendUrl}/document_types/`;

    const response = await httpClient.get(url, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    console.log('Assets types fetched:', data.data);
    return data.data;
}

export async function createDocumentType(documentTypeData: { name: string; color: string }, organizationId: string) {
    const response = await httpClient.post(`${backendUrl}/document_types/`, documentTypeData, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    const data = await response.json();
    console.log('Asset type created:', data.data);
    return data.data;
}
