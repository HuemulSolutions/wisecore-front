import { backendUrl } from "@/config";

export async function getAllTemplates() {
    const response = await fetch(`${backendUrl}/templates/`);
    if (!response.ok) {
        throw new Error('Error al obtener las plantillas');
    }
    const data = await response.json();
    console.log('Templates fetched:', data.data);
    return data.data;
}