import { backendUrl } from "@/config";


export async function search(query: string) {
    const response = await fetch(`${backendUrl}/chunks/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
        throw new Error('Error performing search');
    }
    const data = await response.json();
    console.log('Search results:', data.data);
    return data.data;
}