import { backendUrl } from "@/config";


export async function getLLMs() {
    const response = await fetch(`${backendUrl}/llms/`);
    if (!response.ok) {
        throw new Error('Error al obtener los LLMs');
    }
    const data = await response.json();
    console.log('LLMs fetched:', data.data);
    return data.data;
}

export async function updateLLM(executionId: string, llmId: string) {
    const response = await fetch(`${backendUrl}/execution/update_llm/${executionId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ llm_id: llmId }),
    });

    if (!response.ok) {
        throw new Error('Error al actualizar el LLM');
    }
    return response.json();
}