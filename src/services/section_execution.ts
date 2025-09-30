import { backendUrl } from "@/config";


export async function deleteSectionExec(sectionExecId: string) {
    const response = await fetch(`${backendUrl}/section_executions/${sectionExecId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Error deleting section:', errorResponse);
        throw new Error(errorResponse.detail.error || 'Unknown error');
    }

    const data = await response.json();
    console.log('Section deleted:', data);
    return data;
}