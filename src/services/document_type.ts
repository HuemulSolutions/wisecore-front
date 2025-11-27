import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";


export async function getAllDocumentTypes(organizationId: string) {
    const url = `${backendUrl}/document_types/`;

    const response = await httpClient.get(url, {
        headers: {
            'OrganizationId': organizationId,
        },
    });
    if (!response.ok) {
        throw new Error('Error al obtener los tipos de documentos');
    }
    const data = await response.json();
    console.log('Document types fetched:', data.data);
    return data.data;
}

export async function createDocumentType(documentTypeData: { name: string; color: string }, organizationId: string) {
    const response = await httpClient.post(`${backendUrl}/document_types/`, documentTypeData, {
        headers: {
            'OrganizationId': organizationId,
        },
    });

    if (!response.ok) {
        throw new Error('Error al crear el tipo de documento');
    }
    const data = await response.json();
    console.log('Document type created:', data.data);
    return data.data;
}