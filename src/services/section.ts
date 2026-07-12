import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import type { SectionFormField } from "@/types/sections/core";

export async function createSection(
    sectionData: {
        name: string;
        document_id: string;
        prompt?: string;
        design_prompt?: string;
        generate_content?: boolean;
        generate_design?: boolean;
        html_template_identifier?: string;
        reference_section_id?: string;
        reference_mode?: string;
        reference_execution_id?: string;
        dependencies?: string[];
        type?: "ai" | "manual" | "reference" | "form";
        form_fields?: SectionFormField[];
        execution_id?: string;
        output?: string;
    },
    organizationId: string
) {
    const response = await httpClient.post(`${backendUrl}/sections/`, {
        ...sectionData,
        type: sectionData.type || "ai"
    }, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    const data = await response.json();
    console.log('Section created:', data.data);
    return data.data;
}

export async function updateSection(
    sectionId: string,
    sectionData: {
        name?: string;
        type?: "ai" | "manual" | "reference" | "form";
        prompt?: string;
        design_prompt?: string;
        generate_content?: boolean;
        generate_design?: boolean;
        html_template_identifier?: string;
        output?: string;
        reference_section_id?: string;
        reference_mode?: string;
        reference_execution_id?: string;
        dependencies?: string[];
        propagate_to_template?: boolean;
        propagate_to_executions?: boolean;
        execution_id?: string;
        form_fields?: SectionFormField[];
    },
    organizationId: string
) {
    const response = await httpClient.put(`${backendUrl}/sections/${sectionId}`, sectionData, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    const data = await response.json();
    console.log('Section updated:', data.data);
    return data.data;
}


export async function updateSectionsOrder(sections: { section_id: string; order: number }[], organizationId: string, executionId?: string) {
    const body: { new_order: { section_id: string; order: number }[]; execution_id?: string } = { new_order: sections };
    if (executionId) {
        body.execution_id = executionId;
    }
    const response = await httpClient.put(`${backendUrl}/sections/order`, body, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    const data = await response.json();
    console.log('Sections reordered:', data.data);
    return data.data;
}

export async function deleteSection(
    sectionId: string,
    organizationId: string,
    options?: { executionId?: string }
) {
    const params = new URLSearchParams();
    if (options?.executionId) {
        params.append('execution_id', options.executionId);
    }

    const url = `${backendUrl}/sections/${sectionId}${params.toString() ? `?${params.toString()}` : ''}`;

    await httpClient.delete(url, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    console.log('Section deleted:', sectionId);
    return sectionId;
}

export async function getSectionContent(
    sectionId: string, 
    organizationId: string,
    executionId?: string
) {
    const params = new URLSearchParams();
    if (executionId) {
        params.append('execution_id', executionId);
    }
    
    const url = `${backendUrl}/sections/${sectionId}/content${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await httpClient.get(url, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    const data = await response.json();
    return data.data;
}
