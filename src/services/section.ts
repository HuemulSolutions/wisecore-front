import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

export async function createSection(sectionData: { name: string; prompt: string; dependencies: string[]; document_id: string; type?: string }, organizationId: string) {
    const response = await httpClient.post(`${backendUrl}/sections/`, {
        ...sectionData,
        type: sectionData.type || "text" // Asegurar que siempre se envíe el tipo
    }, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Error creating section:', errorResponse);
        throw new Error(errorResponse.detail.error || 'Unknown error');
    }

    const data = await response.json();
    console.log('Section created:', data.data);
    return data.data;
}

export async function updateSection(sectionId: string, sectionData: { name?: string; prompt?: string; dependencies?: string[] }, organizationId: string) {
    const response = await httpClient.put(`${backendUrl}/sections/${sectionId}`, sectionData, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Error updating section:', errorResponse);
        throw new Error(errorResponse.detail.error || 'Unknown error');
    }
    const data = await response.json();
    console.log('Section updated:', data.data);
    return data.data;
}


export async function updateSectionsOrder(sections: { section_id: string; order: number }[], organizationId: string) {
    const response = await httpClient.put(`${backendUrl}/sections/order`, { new_order: sections }, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Error updating sections order:', errorResponse);
        throw new Error(errorResponse.detail.error || 'Unknown error');
    }

    const data = await response.json();
    console.log('Sections reordered:', data.data);
    return data.data;
}

export async function deleteSection(sectionId: string, organizationId: string) {
    const response = await httpClient.delete(`${backendUrl}/sections/${sectionId}`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Error deleting section:', errorResponse);
        throw new Error(errorResponse.detail.error || 'Unknown error');
    }

    console.log('Section deleted:', sectionId);
    return sectionId;
}