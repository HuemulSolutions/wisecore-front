import { backendUrl } from "@/config";

export async function getAllTemplates() {
    const response = await fetch(`${backendUrl}/templates/`);
    if (!response.ok) {
        throw new Error('Error al obtener las plantillas');
    }
    const data = await response.json();
    console.log('Templates fetched:', data.data);
    return data.data;
}

export async function addTemplate( { name, description }: { name: string, description?: string}) {
    const response = await fetch(`${backendUrl}/templates/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
            description: description || null,
        }),
    });

    if (!response.ok) {
        throw new Error('Error al crear la plantilla');
    }

    const data = await response.json();
    console.log('Template created:', data.data);
    return data.data;
}


export async function getTemplateById(templateId: string) {
    const response = await fetch(`${backendUrl}/templates/${templateId}`);
    if (!response.ok) {
        throw new Error('Error al obtener la plantilla');
    }
    const data = await response.json();
    return data.data;
}

export async function deleteTemplate(templateId: string) {
    const response = await fetch(`${backendUrl}/templates/${templateId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Error al eliminar la plantilla');
    }

    const data = await response.json();
    console.log('Template deleted:', data);
    return data;
}

export async function createTemplateSection(sectionData: { name: string; prompt: string; dependencies: string[]; template_id: string }) {
    const response = await fetch(`${backendUrl}/templates/sections/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(sectionData),
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