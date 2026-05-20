import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

export interface LibraryContentAsset {
    id: string;
    name: string;
    document_type?: { id: string; name: string; color: string };
    folder_id: string | null;
    access_levels?: string[];
}

export interface LibraryContentFolder {
    id: string;
    name: string;
    parent_folder_id: string | null;
    path: string;
    is_match: boolean;
    is_context: boolean;
}

export interface LibraryContent {
    assets: LibraryContentAsset[];
    folders: LibraryContentFolder[];
    has_next: boolean;
}

export async function getLibraryContent(organizationId: string, folderId?: string, page: number = 1, pageSize: number = 1000, search?: string): Promise<LibraryContent> {
    const folderPath = folderId || 'root';
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search) params.set('search', search);
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
