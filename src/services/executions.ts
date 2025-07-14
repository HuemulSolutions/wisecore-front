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