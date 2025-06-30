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

export async function addTemplate( name: string ) {
    const response = await fetch(`${backendUrl}/templates/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
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