import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import type { TemplatesResponse, CloneTemplateRequest, CloneTemplateResult, ChildDocumentExecution, ChildDocument, ChildDocumentFolder, ChildDocumentsResponse } from "@/types/templates";

export type { TemplatesResponse, ChildDocumentExecution, ChildDocument, ChildDocumentFolder, ChildDocumentsResponse };

export async function getAllTemplates(organizationId: string, search?: string, page: number = 1, pageSize: number = 100): Promise<TemplatesResponse> {
    const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
    });
    if (search) {
        params.set('search', search);
    }
    const response = await httpClient.get(`${backendUrl}/templates/?${params.toString()}`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    return response.json();
}

export async function addTemplate( { name, description, instructions, organization_id }: { name: string, description?: string, instructions?: string, organization_id: string}) {
    const response = await httpClient.post(`${backendUrl}/templates/`, {
        name,
        description: description || null,
        instructions: instructions || null
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

export async function updateTemplate(
    templateId: string,
    updateData: {
        name?: string;
        description?: string | null;
        instructions?: string | null;
        asset_kind?: string | null;
        canvas_id?: string | null;
    },
    organizationId: string
) {
    const payload: Record<string, string | null> = {};

    if (updateData.name !== undefined) {
        payload.name = updateData.name;
    }

    if (updateData.description !== undefined) {
        payload.description = updateData.description;
    }

    if (updateData.instructions !== undefined) {
        payload.instructions = updateData.instructions;
    }

    if (updateData.asset_kind !== undefined) {
        payload.asset_kind = updateData.asset_kind;
    }

    if (updateData.canvas_id !== undefined) {
        payload.canvas_id = updateData.canvas_id;
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

export async function cloneTemplate(
    templateId: string,
    organizationId: string,
    options: CloneTemplateRequest = {},
): Promise<CloneTemplateResult> {
    const body: CloneTemplateRequest = {};
    if (options.name !== undefined) {
        body.name = options.name;
    }
    if (options.include_relationships !== undefined) {
        body.include_relationships = options.include_relationships;
    }
    const response = await httpClient.post(`${backendUrl}/templates/${templateId}/clone`, body, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    return data.data;
}

export async function getTemplateChildDocuments(
    templateId: string,
    organizationId: string,
    page: number = 1,
    pageSize: number = 100
): Promise<ChildDocumentsResponse> {
    const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
    });
    const response = await httpClient.get(
        `${backendUrl}/templates/${templateId}/child-documents?${params.toString()}`,
        {
            headers: {
                'X-Org-Id': organizationId,
            },
        }
    );
    return response.json();
}
