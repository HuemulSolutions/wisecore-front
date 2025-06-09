import { backendUrl } from "@/config";


export async function getExecutionsByDocumentId(documentId: string) {
    console.log(`Fetching executions for document ID: ${documentId}`);
    const response = await fetch(`${backendUrl}/execution/${documentId}`);
    if (!response.ok) {
        throw new Error('Error al obtener las ejecuciones del documento');
    }
    const data = await response.json();
    console.log(`Fetched ${data.data.length} executions for document ID: ${documentId}`);
    return data.data;
}