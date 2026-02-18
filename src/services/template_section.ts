import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

// Las secciones ahora vienen incluidas cuando obtenemos el template por ID
// No necesitamos un endpoint separado para obtener las secciones

export async function createTemplateSection(
    sectionData: { 
        name: string; 
        template_id: string;
        prompt?: string; 
        manual_input?: string;
        reference_section_id?: string;
        reference_mode?: string;
        reference_execution_id?: string;
        dependencies?: string[]; 
        type?: "ai" | "manual" | "reference";
        propagate_to_documents?: boolean;
        document_ids?: string[];
    }, 
    organizationId: string
) {
    const response = await httpClient.post(`${backendUrl}/template_section/`, {
        ...sectionData,
        type: sectionData.type || "ai" // Asegurar que siempre se envíe el tipo
    }, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    const data = await response.json();
    console.log('Section created:', data.data);
    return data.data;
}

export async function updateTemplateSection(
    sectionId: string, 
    sectionData: { 
        name?: string; 
        type?: "ai" | "manual" | "reference";
        prompt?: string; 
        manual_input?: string;
        reference_section_id?: string;
        reference_mode?: string;
        reference_execution_id?: string;
        dependencies?: string[]; 
        propagate_to_sections?: boolean; 
        document_ids?: string[];
    }, 
    organizationId: string
) {
    const response = await httpClient.put(`${backendUrl}/template_section/${sectionId}`, sectionData, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    console.log('Section updated:', data.data);
    return data.data;
}

export async function deleteTemplateSection(sectionId: string, organizationId: string) {
    const response = await httpClient.delete(`${backendUrl}/template_section/${sectionId}`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    const data = await response.json();
    console.log('Section deleted:', data);
    return data;
}

export async function deleteTemplateSectionWithPropagation(
    sectionId: string,
    payload: {
        propagate_to_documents?: boolean;
        document_ids?: string[];
    },
    organizationId: string
) {
    const response = await httpClient.fetch(`${backendUrl}/template_section/${sectionId}`, {
        method: 'DELETE',
        headers: {
            'X-Org-Id': organizationId,
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Section deleted:', data);
    return data;
}


export async function updateSectionsOrder(sections: { section_id: string; order: number }[], organizationId: string) {
    const response = await httpClient.put(`${backendUrl}/template_section/order`, { new_order: sections }, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    const data = await response.json();
    console.log('Sections order updated:', data.data);
    return data.data;
}

export async function updateTemplateSectionsOrder(sectionsOrder: { section_id: string; order: number }[], organizationId: string) {
  return updateSectionsOrder(sectionsOrder, organizationId);
}
