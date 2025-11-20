import { backendUrl } from "@/config";

export async function createSection(sectionData: { name: string; prompt: string; dependencies: string[]; document_id: string; type?: string }) {
    const response = await fetch(`${backendUrl}/sections/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...sectionData,
            type: sectionData.type || "text" // Asegurar que siempre se envíe el tipo
        }),
    });

    if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Error creating section:', errorResponse);
        throw new Error(errorResponse.detail.error || 'Unknown error');
    }

    const data = await response.json();
    console.log('Section created:', data.data);
    return data.data;
}

export async function updateSection(sectionId: string, sectionData: { name?: string; prompt?: string; dependencies?: string[] }) {
    const response = await fetch(`${backendUrl}/sections/${sectionId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(sectionData),
    });

    if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Error updating section:', errorResponse);
        throw new Error(errorResponse.detail.error || 'Unknown error');
    }
    const data = await response.json();
    console.log('Section updated:', data.data);
    return data.data;
}


export async function updateSectionsOrder(sections: { section_id: string; order: number }[]) {
    const response = await fetch(`${backendUrl}/sections/order`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_order: sections }),
    });

    if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Error updating sections order:', errorResponse);
        throw new Error(errorResponse.detail.error || 'Unknown error');
    }

    const data = await response.json();
    console.log('Sections reordered:', data.data);
    return data.data;
}

export async function deleteSection(sectionId: string) {
    const response = await fetch(`${backendUrl}/sections/${sectionId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Error deleting section:', errorResponse);
        throw new Error(errorResponse.detail.error || 'Unknown error');
    }

    console.log('Section deleted:', sectionId);
    return sectionId;
}