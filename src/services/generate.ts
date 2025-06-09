import { backendUrl } from "@/config";
// import { on } from "events";

interface StreamedData {
    sectionId: string; // Para saber a qué sección pertenece el contenido
    text: string;
    type: 'info' | 'content';
}

interface GenerateStreamParams {
    documentId: string;
    onData: (data: StreamedData) => void; // Callback para procesar cada trozo de datos
    onInfo: (sectionName: string, sectionId: string) => void; // Callback para cuando se recibe info de una nueva sección
    onError: (error: Event) => void; // Callback para errores
    onClose: () => void; // Callback para cuando la conexión se cierra
}

export const streamGeneratedText = async (params: GenerateStreamParams): Promise<void> => {
    if (!params) {
        throw new TypeError("streamGeneratedText: parámetro 'params' es undefined. Debes pasar un objeto con las propiedades requeridas.");
    }
    const { documentId, onData, onInfo, onError, onClose } = params;

    // let currentSectionId = '';
    let controller = new AbortController();

    try {
        const response = await fetch(`${backendUrl}/generation/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ document_id: documentId }),
            signal: controller.signal,
        });

        if (!response.body) throw new Error('No response body');
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        // let eventType = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let lines = buffer.split(/\r?\n/);
            buffer = lines.pop() || '';
            for (const line of lines) {
                console.log('Received line:', line);
                onData({ sectionId: '', text: line, type: 'content' });
                onInfo('Nueva sección', ''); // Aquí deberías extraer el ID de sección real si está disponible
            }
        }
        onClose();
    } catch (error) {
        onError(error as Event);
        onClose();
    }
};