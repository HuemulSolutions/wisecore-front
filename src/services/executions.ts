import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";


export async function getExecutionsByDocumentId(documentId: string, organizationId: string) {
    console.log(`Fetching executions for document ID: ${documentId}`);
    const response = await httpClient.get(`${backendUrl}/documents/${documentId}/executions`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    console.log(`Fetched ${data.data.length} executions for document ID: ${documentId}`);
    return data.data;
}

export async function getExecutionById(executionId: string, organizationId: string) {
    console.log(`Fetching execution with ID: ${executionId}`);
    const response = await httpClient.get(`${backendUrl}/execution/${executionId}`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    console.log('Execution fetched:', data.data);
    return data.data;
}

export async function getExecutionStatus(executionId: string, organizationId: string) {
    console.log(`Fetching execution status with ID: ${executionId}`);
    const response = await httpClient.get(`${backendUrl}/execution/${executionId}/status`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    
    const data = await response.json();
    console.log('Execution status fetched:', data);
    return data.data || data; // Handle both data.data and direct data response
}

export async function getExecutionSectionsStatus(executionId: string, organizationId: string) {
    console.log(`Fetching sections status for execution ID: ${executionId}`);
    const response = await httpClient.get(`${backendUrl}/execution/${executionId}/sections_status`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    
    const data = await response.json();
    console.log('Sections status fetched:', data.data);
    return data.data;
}

export async function createExecution(documentId: string, organizationId: string) {
    console.log(`Creating execution for document ID: ${documentId}`);
    const response = await httpClient.post(`${backendUrl}/execution/${documentId}`, {}, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    const data = await response.json();
    console.log('Execution created:', data.data);
    return data.data;
}

export async function executeDocument({
    documentId,
    llmId,
    instructions,
    organizationId,
    singleSectionMode,
    startSectionId,
    executionId
}: {
    documentId: string;
    llmId: string;
    instructions?: string;
    organizationId: string;
    singleSectionMode?: boolean;
    startSectionId?: string;
    executionId?: string;
}) {
    console.log(`Executing document with ID: ${documentId}`);
    
    const requestBody: Record<string, unknown> = {
        document_id: documentId,
        llm_id: llmId
    };
    
    // Add optional parameters only when they have values
    if (instructions) {
        requestBody.instructions = instructions;
    }
    
    if (executionId) {
        requestBody.execution_id = executionId;
    }
    
    if (startSectionId) {
        requestBody.start_section_id = startSectionId;
    }
    
    // Include single_section_mode when explicitly provided
    if (singleSectionMode !== undefined) {
        requestBody.single_section_mode = singleSectionMode;
    }
    
    const response = await httpClient.post(`${backendUrl}/execution/generate`, requestBody, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    const data = await response.json();
    console.log('Document execution started:', data.data);
    return data.data;
}


export async function deleteExecution(executionId: string, organizationId: string) {
    console.log(`Deleting execution with ID: ${executionId}`);
    const response = await httpClient.delete(`${backendUrl}/execution/${executionId}`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    console.log('Execution deleted:', data);
    return data;
}


export async function updateLLM(executionId: string, llmId: string, organizationId: string) {
    console.log(`Updating LLM for execution ID: ${executionId} with LLM ID: ${llmId}`);
    const response = await httpClient.put(`${backendUrl}/execution/update_llm/${executionId}`, { llm_id: llmId }, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    const data = await response.json();
    console.log('LLM updated for execution:', data.data);
    return data.data;
}

async function exportExecutionFile(executionId: string, exportType: 'markdown' | 'word' | 'custom_word', organizationId: string) {
    const endpoints = {
        markdown: `execution/${executionId}/export_markdown`,
        word: `execution/${executionId}/export_word`,
        custom_word: `execution/${executionId}/export_custom_word`
    };
    
    const extensions = {
        markdown: 'md',
        word: 'docx',
        custom_word: 'docx'
    };
        
    console.log(`Exporting execution to ${exportType} for ID: ${executionId}`);
    
    // Usar fetch nativo para tener acceso completo a los headers
    const orgToken = httpClient.getOrganizationToken();
    const response = await fetch(`${backendUrl}/${endpoints[exportType]}`, {
        headers: {
            'Authorization': `Bearer ${orgToken}`,
            'X-Org-Id': organizationId,
        },
    });
    
    if (!response.ok) {
        throw new Error(`Error al exportar la ejecución a ${exportType}`);
    }

    // Obtener el contenido del archivo y el nombre del archivo desde los headers
    const blob = await response.blob();
    
    const contentDisposition = response.headers.get('content-disposition');
    
    // Extraer el nombre del archivo del header content-disposition
    let filename = `execution_${executionId}.${extensions[exportType]}`;
    if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/) || 
                             contentDisposition.match(/filename=([^;]+)/);
        if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].trim();
        }
    }
    
    // Crear el enlace de descarga
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Disparar la descarga
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log(`Execution exported successfully as: ${filename}`);
    return { success: true };
}

export async function exportExecutionToMarkdown(executionId: string, organizationId: string) {
    return exportExecutionFile(executionId, 'markdown', organizationId);
}

export async function exportExecutionToWord(executionId: string, organizationId: string) {
    return exportExecutionFile(executionId, 'word', organizationId);
}

export async function exportExecutionCustomWord(executionId: string, organizationId: string) {
    return exportExecutionFile(executionId, 'custom_word', organizationId);
}

export async function approveExecution(executionId: string, organizationId: string) {
    console.log(`Approving execution with ID: ${executionId}`);
    const response = await httpClient.post(`${backendUrl}/execution/${executionId}/approve`, {}, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    console.log('Execution approved:', data.data);
    return data.data;
}

export async function disapproveExecution(executionId: string, organizationId: string) {
    console.log(`Disapproving execution with ID: ${executionId}`);
    const response = await httpClient.post(`${backendUrl}/execution/${executionId}/dissapprove`, {}, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    console.log('Execution disapproved:', data.data);
    return data.data;
}

export async function cloneExecution(executionId: string, organizationId: string) {
    console.log(`Cloning execution with ID: ${executionId}`);
    const response = await httpClient.post(`${backendUrl}/execution/${executionId}/clone`, {}, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    console.log('Execution cloned:', data.data);
    return data.data;
}
