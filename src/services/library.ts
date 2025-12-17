import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

export async function getLibraryContent(organizationId: string, folderId?: string) {
    const folderPath = folderId || 'root';
    const url = `${backendUrl}/folder/${folderPath}`;
    const response = await httpClient.get(url, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    if (!response.ok) {
        let errorMessage = 'Error fetching library content';
        try {
            const errorData = await response.json();
            if (errorData.detail) {
                errorMessage = errorData.detail;
            }
        } catch {
            // If we can't parse the error response, use the default message
        }
        throw new Error(errorMessage);
    }
    const data = await response.json();
    console.log('Library content fetched:', data.data);
    return data.data;
}


export async function createFolder(name: string, organizationId: string, parentId?: string) {
    const requestBody: {
        name: string;
        organization_id: string;
        parent_folder_id?: string;
    } = {
        name,
        organization_id: organizationId,
    };
    
    if (parentId) {
        requestBody.parent_folder_id = parentId;
    }

    const response = await httpClient.post(`${backendUrl}/folder/create_folder`, requestBody, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    if (!response.ok) {
        throw new Error('Error creating folder');
    }
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
    if (!response.ok) {
        throw new Error('Error editing folder');
    }
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
    if (!response.ok) {
        throw new Error('Error deleting folder');
    }
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
    if (!response.ok) {
        throw new Error('Error moving folder');
    }
    const data = await response.json();
    console.log('Folder moved:', folderId, 'to parent:', newParentId, data?.data);
    return data?.data;
}