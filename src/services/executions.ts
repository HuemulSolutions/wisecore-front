import { backendUrl } from "@/config";


export async function getExecutionsByDocumentId(documentId: string) {
    console.log(`Fetching executions for document ID: ${documentId}`);
    const response = await fetch(`${backendUrl}/documents/${documentId}/executions`);
    if (!response.ok) {
        throw new Error('Error al obtener las ejecuciones del documento');
    }
    const data = await response.json();
    console.log(`Fetched ${data.data.length} executions for document ID: ${documentId}`);
    return data.data;
}

export async function getExecutionById(executionId: string) {
    console.log(`Fetching execution with ID: ${executionId}`);
    const response = await fetch(`${backendUrl}/execution/${executionId}`);
    if (!response.ok) {
        throw new Error('Error al obtener la ejecución');
    }
    const data = await response.json();
    console.log('Execution fetched:', data.data);
    return data.data;

}

export async function createExecution(documentId: string) {
    console.log(`Creating execution for document ID: ${documentId}`);
    const response = await fetch(`${backendUrl}/execution/${documentId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Error al crear la ejecución del documento');
    }

    const data = await response.json();
    console.log('Execution created:', data.data);
    return data.data;
}

export async function modifyContent(sectionId: string, content: string) {
    console.log(`Modifying content for section ID: ${sectionId}`);
    const response = await fetch(`${backendUrl}/execution/modify_content/${sectionId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content }),
    });

    if (!response.ok) {
        throw new Error('Error al modificar el contenido de la sección');
    }

    const data = await response.json();
    console.log('Section content modified:', data.data);
    return data.data;
}

export async function exportExecutionToMarkdown(executionId: string) {
    console.log(`Exporting execution to markdown for ID: ${executionId}`);
    const response = await fetch(`${backendUrl}/execution/export_markdown/${executionId}`);
    
    if (!response.ok) {
        throw new Error('Error al exportar la ejecución a markdown');
    }

    // Obtener el contenido del archivo y el nombre del archivo desde los headers
    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition?.match(/filename="?([^"]+)"?/)?.[1] || `execution_${executionId}.md`;
    
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


