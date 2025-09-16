import { backendUrl } from "@/config";

export async function getLibraryContent(organizationId: string, folderId?: string) {
    const folderPath = folderId || 'root';
    const url = `${backendUrl}/library/${folderPath}`;
    const response = await fetch(url, {
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
    const response = await fetch(`${backendUrl}/library/create_folder`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
            type: 'folder',
            organization_id: organizationId,
            parent_folder_id: parentId || null,
        }),
    });
    if (!response.ok) {
        throw new Error('Error creating folder');
    }
    const data = await response.json();
    console.log('Folder created:', data.data);
    return data.data;
}


export async function deleteFolder(folderId: string) {
    const response = await fetch(`${backendUrl}/library/${folderId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error('Error deleting folder');
    }
    const data = await response.json();
    console.log('Folder deleted:', folderId, data?.data);
    return data?.data;
}