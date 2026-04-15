import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

export interface TemplatesResponse {
  data: { id: string; name: string; description?: string }[];
  page: number;
  page_size: number;
  has_next: boolean;
  total?: number;
  transaction_id: string;
  timestamp: string;
}

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

export interface ChildDocumentExecution {
    id: string;
    name: string;
    version: string | null;
}

export interface ChildDocument {
    id: string;
    name: string;
    description: string;
    internal_code: string | null;
    asset_kind: string | null;
    access_level: string;
    folder_id: string;
    document_type_id: string;
    created_at: string;
    updated_at: string;
    executions: ChildDocumentExecution[];
}

export interface ChildDocumentFolder {
    folder_id: string;
    folder_name: string;
    documents: ChildDocument[];
}

export interface ChildDocumentsResponse {
    data: ChildDocumentFolder[];
    transaction_id: string;
    page: number;
    page_size: number;
    has_next: boolean;
    timestamp: string;
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
