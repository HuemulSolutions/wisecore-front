import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";


export async function modifyContent(sectionId: string, content: string) {
    console.log(`Modifying content for section ID: ${sectionId}`);
    const response = await httpClient.put(`${backendUrl}/section_executions/${sectionId}/modify_content`, { new_content: content });

    if (!response.ok) {
        throw new Error('Error al modificar el contenido de la sección');
    }

    const data = await response.json();
    console.log('Section content modified:', data.data);
    return data.data;
}


export async function deleteSectionExec(sectionExecId: string) {
    const response = await httpClient.delete(`${backendUrl}/section_executions/${sectionExecId}`);

    if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Error deleting section:', errorResponse);
        throw new Error(errorResponse.detail.error || 'Unknown error');
    }

    const data = await response.json();
    console.log('Section deleted:', data);
    return data;
}