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