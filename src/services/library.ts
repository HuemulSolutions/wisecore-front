import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

export async function getLibraryContent(organizationId: string, folderId?: string) {
    const folderPath = folderId || 'root';
    const url = `${backendUrl}/folder/${folderPath}`;
    const response = await httpClient.get(url, {
        headers: {
            'OrganizationId': organizationId,
        },
    });
    if (!response.ok) {
        throw new Error('Error fetching library content');
    }
    const data = await response.json();
    console.log('Library content fetched:', data.data);
    return data.data;
}


export async function createFolder(name: string, organizationId?: string, parentId?: string) {
    const response = await httpClient.post(`${backendUrl}/folder/create_folder`, {
        name,
        type: 'folder',
        organization_id: organizationId,
        parent_folder_id: parentId || null,
    });
    if (!response.ok) {
        throw new Error('Error creating folder');
    }
    const data = await response.json();
    console.log('Folder created:', data.data);
    return data.data;
}


export async function editFolder(folderId: string, name: string) {
    const response = await httpClient.put(`${backendUrl}/folder/${folderId}`, {
        name,
    });
    if (!response.ok) {
        throw new Error('Error editing folder');
    }
    const data = await response.json();
    console.log('Folder edited:', folderId, data?.data);
    return data?.data;
}

export async function deleteFolder(folderId: string) {
    const response = await httpClient.delete(`${backendUrl}/folder/${folderId}`);
    if (!response.ok) {
        throw new Error('Error deleting folder');
    }
    const data = await response.json();
    console.log('Folder deleted:', folderId, data?.data);
    return data?.data;
}

export async function moveFolder(folderId: string, newParentId?: string) {
    const response = await httpClient.put(`${backendUrl}/folder/${folderId}/move`, {
        parent_folder_id: newParentId || null,
    });
    if (!response.ok) {
        throw new Error('Error moving folder');
    }
    const data = await response.json();
    console.log('Folder moved:', folderId, 'to parent:', newParentId, data?.data);
    return data?.data;
}