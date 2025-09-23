import { backendUrl } from "@/config";

export async function getAllTemplates(organizationId: string) {
    const response = await fetch(`${backendUrl}/templates/`, {
        headers: {
            'OrganizationId': organizationId,
        },
    });
    if (!response.ok) {
        throw new Error('Error al obtener las plantillas');
    }
    const data = await response.json();
    console.log('Templates fetched:', data.data);
    return data.data;
}

export async function addTemplate( { name, description, organization_id }: { name: string, description?: string, organization_id: string}) {
    const response = await fetch(`${backendUrl}/templates/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'OrganizationId': organization_id,
        },
        body: JSON.stringify({
            name,
            description: description || null
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


export async function updateTemplateSection(sectionId: string, sectionData: { name?: string; prompt?: string; dependencies?: string[] }) {
    const response = await fetch(`${backendUrl}/templates/sections/${sectionId}`, {
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
    const response = await fetch(`${backendUrl}/templates/sections/${sectionId}`, {
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

export async function exportTemplate(templateId: string) {
    const response = await fetch(`${backendUrl}/templates/${templateId}/export`);
    if (!response.ok) {
        throw new Error('Error al exportar la plantilla');
    }
    const data = await response.json();
    console.log('Template exported:', data.data);
    return data.data;
}

export async function updateSectionsOrder(sections: { section_id: string; order: number }[]) {
    const response = await fetch(`${backendUrl}/templates/sections/order`, {
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

export async function generateTemplateSections(templateId: string) {
    const response = await fetch(`${backendUrl}/templates/${templateId}/generate`, {
        method: 'POST',
    });

    if (!response.ok) {
        throw new Error('Error al generar las secciones de la plantilla');
    }

    const data = await response.json();
    console.log('Template sections generated:', data.data);
    return data.data;
}