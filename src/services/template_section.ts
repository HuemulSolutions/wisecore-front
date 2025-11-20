import { backendUrl } from "@/config";

// Las secciones ahora vienen incluidas cuando obtenemos el template por ID
// No necesitamos un endpoint separado para obtener las secciones

export async function createTemplateSection(sectionData: { name: string; prompt: string; dependencies: string[]; template_id: string; type?: string }) {
    const response = await fetch(`${backendUrl}/template_section/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...sectionData,
            type: sectionData.type || "text" // Asegurar que siempre se envíe el tipo
        }),
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

export async function updateTemplateSection(sectionId: string, sectionData: { name?: string; prompt?: string; dependencies?: string[] }) {
    const response = await fetch(`${backendUrl}/template_section/${sectionId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(sectionData),
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

export async function deleteTemplateSection(sectionId: string) {
    const response = await fetch(`${backendUrl}/template_section/${sectionId}`, {
        method: 'DELETE',
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


export async function updateSectionsOrder(sections: { section_id: string; order: number }[]) {
    const response = await fetch(`${backendUrl}/template_section/order`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_order: sections }),
    });

    if (!response.ok) {
        throw new Error('Error al actualizar el orden de las secciones');
    }

    const data = await response.json();
    console.log('Sections order updated:', data.data);
    return data.data;
}

export async function updateTemplateSectionsOrder(sectionsOrder: { section_id: string; order: number }[]) {
  return updateSectionsOrder(sectionsOrder);
}
