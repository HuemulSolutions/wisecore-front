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
        const errorResponse = await response.json();
        console.error('Error creating template:', errorResponse);
        throw new Error(errorResponse.error || 'Error al crear la plantilla');
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

export async function updateTemplate(templateId: string, updateData: { name?: string; description?: string | null }) {
    const payload: Record<string, string | null> = {};

    if (updateData.name !== undefined) {
        payload.name = updateData.name;
    }

    if (updateData.description !== undefined) {
        payload.description = updateData.description;
    }

    const response = await fetch(`${backendUrl}/templates/${templateId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        let errorMessage = 'Error al actualizar la plantilla';

        try {
            const errorResponse = await response.json();
            console.error('Error updating template:', errorResponse);
            errorMessage = errorResponse.error || errorMessage;
        } catch (parseError) {
            console.error('Error parsing update template error response:', parseError);
        }

        throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Template updated:', data.data);
    return data.data;
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
