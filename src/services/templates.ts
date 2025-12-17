import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

export async function getAllTemplates(organizationId: string) {
    const response = await httpClient.get(`${backendUrl}/templates/`, {
        headers: {
            'X-Org-Id': organizationId,
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
    const response = await httpClient.post(`${backendUrl}/templates/`, {
        name,
        description: description || null
    }, {
        headers: {
            'X-Org-Id': organization_id,
        },
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


export async function getTemplateById(templateId: string, organizationId: string) {
    const response = await httpClient.get(`${backendUrl}/templates/${templateId}`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    if (!response.ok) {
        throw new Error('Error al obtener la plantilla');
    }
    const data = await response.json();
    return data.data;
}

export async function deleteTemplate(templateId: string, organizationId: string) {
    const response = await httpClient.delete(`${backendUrl}/templates/${templateId}`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    if (!response.ok) {
        throw new Error('Error al eliminar la plantilla');
    }

    const data = await response.json();
    console.log('Template deleted:', data);
    return data;
}

export async function updateTemplate(templateId: string, updateData: { name?: string; description?: string | null }, organizationId: string) {
    const payload: Record<string, string | null> = {};

    if (updateData.name !== undefined) {
        payload.name = updateData.name;
    }

    if (updateData.description !== undefined) {
        payload.description = updateData.description;
    }

    const response = await httpClient.put(`${backendUrl}/templates/${templateId}`, payload, {
        headers: {
            'X-Org-Id': organizationId,
        },
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


export async function exportTemplate(templateId: string, organizationId: string) {
    const response = await httpClient.get(`${backendUrl}/templates/${templateId}/export`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    if (!response.ok) {
        throw new Error('Error al exportar la plantilla');
    }
    const data = await response.json();
    console.log('Template exported:', data.data);
    return data.data;
}

export async function generateTemplateSections(templateId: string, organizationId: string) {
    const response = await httpClient.post(`${backendUrl}/templates/${templateId}/generate`, {}, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    if (!response.ok) {
        throw new Error('Error al generar las secciones de la plantilla');
    }

    const data = await response.json();
    console.log('Template sections generated:', data.data);
    return data.data;
}
