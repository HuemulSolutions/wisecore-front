import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

export async function getLibraryContent(organizationId: string, folderId?: string, page: number = 1, pageSize: number = 1000) {
    const folderPath = folderId || 'root';
    const url = `${backendUrl}/folder/${folderPath}/get_content?page=${page}&page_size=${pageSize}`;
    const response = await httpClient.get(url, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    console.log('Library content fetched:', data.data);
    return data.data;
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

export async function deleteFolder(folderId: string, organizationId: string) {
    const response = await httpClient.delete(`${backendUrl}/folder/${folderId}`, {
        headers: {
            'X-Org-Id': organizationId,
        },
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
