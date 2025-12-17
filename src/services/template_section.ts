import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

// Las secciones ahora vienen incluidas cuando obtenemos el template por ID
// No necesitamos un endpoint separado para obtener las secciones

export async function createTemplateSection(sectionData: { name: string; prompt: string; dependencies: string[]; template_id: string; type?: string }, organizationId: string) {
    const response = await httpClient.post(`${backendUrl}/template_section/`, {
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

export async function updateTemplateSection(sectionId: string, sectionData: { name?: string; prompt?: string; dependencies?: string[] }, organizationId: string) {
    const response = await httpClient.put(`${backendUrl}/template_section/${sectionId}`, sectionData, {
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

export async function deleteTemplateSection(sectionId: string, organizationId: string) {
    const response = await httpClient.delete(`${backendUrl}/template_section/${sectionId}`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Error deleting section:', errorResponse);
        throw new Error(errorResponse.detail.error || 'Unknown error');
    }

    const data = await response.json();
    console.log('Section deleted:', data);
    return data;
}


export async function updateSectionsOrder(sections: { section_id: string; order: number }[], organizationId: string) {
    const response = await httpClient.put(`${backendUrl}/template_section/order`, { new_order: sections }, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    if (!response.ok) {
        throw new Error('Error al actualizar el orden de las secciones');
    }

    const data = await response.json();
    console.log('Sections order updated:', data.data);
    return data.data;
}

export async function updateTemplateSectionsOrder(sectionsOrder: { section_id: string; order: number }[], organizationId: string) {
  return updateSectionsOrder(sectionsOrder, organizationId);
}
