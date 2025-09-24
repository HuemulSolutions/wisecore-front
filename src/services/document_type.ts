import { backendUrl } from "@/config";


export async function getAllDocumentTypes(organizationId: string) {
    const url = new URL(`${backendUrl}/document_types/`);

    const response = await fetch(url.toString(), {
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
    const response = await fetch(`${backendUrl}/document_types/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'OrganizationId': organizationId,
        },
        body: JSON.stringify(documentTypeData),
    });

    if (!response.ok) {
        throw new Error('Error al crear el tipo de documento');
    }
    const data = await response.json();
    console.log('Document type created:', data.data);
    return data.data;
}