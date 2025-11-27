import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";


export async function getExecutionsByDocumentId(documentId: string) {
    console.log(`Fetching executions for document ID: ${documentId}`);
    const response = await httpClient.get(`${backendUrl}/documents/${documentId}/executions`);
    if (!response.ok) {
        throw new Error('Error al obtener las ejecuciones del documento');
    }
    const data = await response.json();
    console.log(`Fetched ${data.data.length} executions for document ID: ${documentId}`);
    return data.data;
}

export async function getExecutionById(executionId: string) {
    console.log(`Fetching execution with ID: ${executionId}`);
    const response = await httpClient.get(`${backendUrl}/execution/${executionId}`);
    if (!response.ok) {
        throw new Error('Error al obtener la ejecución');
    }
    const data = await response.json();
    console.log('Execution fetched:', data.data);
    return data.data;
}

export async function getExecutionStatus(executionId: string) {
    console.log(`Fetching execution status with ID: ${executionId}`);
    try {
        const response = await httpClient.get(`${backendUrl}/execution/status/${executionId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Execution status fetched:', data);
        return data.data || data; // Handle both data.data and direct data response
    } catch (error) {
        console.error('Error fetching execution status:', error);
        throw new Error('Error al obtener el estado de la ejecución');
    }
}

export async function createExecution(documentId: string) {
    console.log(`Creating execution for document ID: ${documentId}`);
    const response = await httpClient.post(`${backendUrl}/execution/${documentId}`);

    if (!response.ok) {
        throw new Error('Error al crear la ejecución del documento');
    }

    const data = await response.json();
    console.log('Execution created:', data.data);
    return data.data;
}


export async function deleteExecution(executionId: string) {
    console.log(`Deleting execution with ID: ${executionId}`);
    const response = await httpClient.delete(`${backendUrl}/execution/${executionId}`);
    if (!response.ok) {
        throw new Error('Error al eliminar la ejecución');
    }
    const data = await response.json();
    console.log('Execution deleted:', data);
    return data;
}


export async function updateLLM(executionId: string, llmId: string) {
    console.log(`Updating LLM for execution ID: ${executionId} with LLM ID: ${llmId}`);
    const response = await httpClient.put(`${backendUrl}/execution/update_llm/${executionId}`, { llm_id: llmId });

    if (!response.ok) {
        throw new Error('Error al actualizar el LLM de la ejecución');
    }

    const data = await response.json();
    console.log('LLM updated for execution:', data.data);
    return data.data;
}

async function exportExecutionFile(executionId: string, exportType: 'markdown' | 'word' | 'custom_word') {
    const endpoints = {
        markdown: 'export_markdown',
        word: 'export_word',
        custom_word: 'export_custom_word'
    };
    
    const extensions = {
        markdown: 'md',
        word: 'docx',
        custom_word: 'docx'
    };
    
    console.log(`Exporting execution to ${exportType} for ID: ${executionId}`);
    const response = await httpClient.get(`${backendUrl}/execution/${endpoints[exportType]}/${executionId}`);
    
    if (!response.ok) {
        throw new Error(`Error al exportar la ejecución a ${exportType}`);
    }

    // Obtener el contenido del archivo y el nombre del archivo desde los headers
    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition?.match(/filename="?([^"]+)"?/)?.[1] || `execution_${executionId}.${extensions[exportType]}`;
    
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
    return { filename, success: true };
}

export async function exportExecutionToMarkdown(executionId: string) {
    return exportExecutionFile(executionId, 'markdown');
}

export async function exportExecutionToWord(executionId: string) {
    return exportExecutionFile(executionId, 'word');
}

export async function exportExecutionCustomWord(executionId: string) {
    return exportExecutionFile(executionId, 'custom_word');
}

export async function approveExecution(executionId: string) {
    console.log(`Approving execution with ID: ${executionId}`);
    const response = await httpClient.post(`${backendUrl}/execution/approve/${executionId}`);
    if (!response.ok) {
        throw new Error('Error al aprobar la ejecución');
    }
    const data = await response.json();
    console.log('Execution approved:', data.data);
    return data.data;
}

export async function disapproveExecution(executionId: string) {
    console.log(`Disapproving execution with ID: ${executionId}`);
    const response = await httpClient.post(`${backendUrl}/execution/disapprove/${executionId}`);
    if (!response.ok) {
        throw new Error('Error al desaprobar la ejecución');
    }
    const data = await response.json();
    console.log('Execution disapproved:', data.data);
    return data.data;
}


