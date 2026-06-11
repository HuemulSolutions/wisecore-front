import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import type {
    LibraryContentAsset,
    LibraryContentFolder,
    LibraryContent,
    GetLibraryContentFilters,
} from "@/types/folders";

export type { LibraryContentAsset, LibraryContentFolder, LibraryContent, GetLibraryContentFilters };

export async function getLibraryContent(
    organizationId: string,
    folderId?: string,
    page: number = 1,
    pageSize: number = 1000,
    search?: string,
    filters?: GetLibraryContentFilters,
): Promise<LibraryContent> {
    const folderPath = folderId || 'root';
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search) params.set('search', search);
    if (filters) {
        if (filters.has_pending_ai_suggestion != null) params.set('has_pending_ai_suggestion', String(filters.has_pending_ai_suggestion));
        if (filters.lifecycle_state != null) params.set('lifecycle_state', filters.lifecycle_state);
        if (filters.owner_scope != null) params.set('owner_scope', filters.owner_scope);
        if (filters.has_unresolved_comments != null) params.set('has_unresolved_comments', String(filters.has_unresolved_comments));
        if (filters.template_id != null) params.set('template_id', filters.template_id);
        if (filters.document_type_id != null) params.set('document_type_id', filters.document_type_id);
        if (filters.expiration_date != null) params.set('expiration_date', filters.expiration_date);
        if (filters.estimated_publication_date != null) params.set('estimated_publication_date', filters.estimated_publication_date);
        if (filters.review_date != null) params.set('review_date', filters.review_date);
        if (filters.audit_date != null) params.set('audit_date', filters.audit_date);
    }
    const url = `${backendUrl}/folder/${folderPath}/get_content?${params.toString()}`;
    const response = await httpClient.get(url, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const raw = await response.json();
    return {
        ...(raw.data as Omit<LibraryContent, 'has_next'>),
        has_next: raw.has_next ?? false,
    };
}

export async function getLibraryContentByAsset(
    organizationId: string,
    assetId: string,
    page: number = 1,
    pageSize: number = 1000,
): Promise<LibraryContent> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    const url = `${backendUrl}/folder/by-asset/${assetId}?${params.toString()}`;
    const response = await httpClient.get(url, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const raw = await response.json();
    return {
        ...(raw.data as Omit<LibraryContent, 'has_next'>),
        has_next: raw.has_next ?? false,
    };
}


export async function createFolder(name: string, organizationId: string, parentId?: string) {
    const requestBody: {
        name: string;
        parent_folder_id?: string;
    } = {
        name,
    };
    
    if (parentId) {
        requestBody.parent_folder_id = parentId;
    }

    const response = await httpClient.post(`${backendUrl}/folder/`, requestBody, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    console.log('Folder created:', data.data);
    return data.data;
}


export async function editFolder(folderId: string, name: string, organizationId: string) {
    const response = await httpClient.put(`${backendUrl}/folder/${folderId}`, {
        name,
    }, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    console.log('Folder edited:', folderId, data?.data);
    return data?.data;
}

export async function deleteFolder(folderId: string, organizationId: string, deleteDocuments: boolean = false) {
    const response = await httpClient.delete(`${backendUrl}/folder/${folderId}`, {
        headers: {
            'X-Org-Id': organizationId,
        },
        body: JSON.stringify({ delete_documents: deleteDocuments }),
    });
    const data = await response.json();
    console.log('Folder deleted:', folderId, data?.data);
    return data?.data;
}

export async function moveFolder(folderId: string, newParentId: string | undefined, organizationId: string) {
    const response = await httpClient.put(`${backendUrl}/folder/${folderId}/move`, {
        parent_folder_id: newParentId || null,
    }, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    console.log('Folder moved:', folderId, 'to parent:', newParentId, data?.data);
    return data?.data;
}
