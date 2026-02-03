import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

export async function getAllTemplates(organizationId: string) {
    const response = await httpClient.get(`${backendUrl}/templates/`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
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
    const data = await response.json();
    return data.data;
}

export async function deleteTemplate(templateId: string, organizationId: string) {
    const response = await httpClient.delete(`${backendUrl}/templates/${templateId}`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

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

    const data = await response.json();
    console.log('Template sections generated:', data.data);
    return data.data;
}
