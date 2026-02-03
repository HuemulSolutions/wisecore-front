import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";


export async function modifyContent(sectionId: string, content: string) {
    console.log(`Modifying content for section ID: ${sectionId}`);
    const response = await httpClient.put(`${backendUrl}/section_executions/${sectionId}/modify_content`, { new_content: content });

    const data = await response.json();
    console.log('Section content modified:', data.data);
    return data.data;
}


export async function deleteSectionExec(sectionExecId: string) {
    const response = await httpClient.delete(`${backendUrl}/section_executions/${sectionExecId}`);

    const data = await response.json();
    console.log('Section deleted:', data);
    return data;
}

export async function createSectionExecution(executionId: string, sectionData: {
    name: string;
    output: string;
    after_from?: string;
}) {
    console.log(`Creating section execution for execution ID: ${executionId}`);
    const response = await httpClient.post(`${backendUrl}/section_executions/${executionId}`, sectionData);

    const data = await response.json();
    console.log('Section execution created:', data.data);
    return data.data;
}

export async function getSectionExecutionContent(sectionExecutionId: string, organizationId?: string) {
    console.log(`Getting content for section execution ID: ${sectionExecutionId}`);
    
    const headers: Record<string, string> = {};
    if (organizationId) {
        headers['X-Org-Id'] = organizationId;
    }
    
    const response = await httpClient.get(`${backendUrl}/section_executions/${sectionExecutionId}/content`, {
        headers,
    });

    const data = await response.json();
    console.log('Section execution content:', data.data);
    
    // Extract the actual content from the response
    if (data.data && typeof data.data === 'object' && data.data.output) {
        const output = data.data.output;
        console.log('Returning output, type:', typeof output, 'length:', output?.length || 0);
        return output;
    }
    
    // Fallback in case the structure is different
    console.warn('Unexpected data structure, returning fallback:', data.data);
    return data.data || '';
}
