import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import { logger } from "@/lib/logger";


export async function getAllDocumentTypes(organizationId: string, search?: string) {
    const url = new URL(`${backendUrl}/document_types/`);
    if (search?.trim()) {
        url.searchParams.append('search', search.trim());
    }

    const response = await httpClient.get(url.toString(), {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    logger.log('Assets types fetched:', data.data);
    return data.data;
}

export async function createDocumentType(documentTypeData: { name: string; color: string }, organizationId: string) {
    const response = await httpClient.post(`${backendUrl}/document_types/`, documentTypeData, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    const data = await response.json();
    logger.log('Asset type created:', data.data);
    return data.data;
}
