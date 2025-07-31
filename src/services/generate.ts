import { backendUrl } from "@/config";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { EventSourceMessage } from "@microsoft/fetch-event-source";

interface GenerateStreamParams {
    documentId: string;
    executionId: string;
    userInstructions?: string;
    onData: (text: string) => void; // Callback para procesar cada trozo de datos
    onInfo: (sectionId: string) => void; // Callback para cuando se recibe info de una nueva sección
    onError: (error: Event) => void; // Callback para errores
    onClose: () => void; // Callback para cuando la conexión se cierra
}

async function* fetchGeneration(documentId: string, executionId: string, userInstructions?: string): AsyncGenerator<any, void, unknown> {
  const events: any[] = [];
  let closed = false;
  let resolveEvent: (() => void) | null = null;
  let eventPromise = new Promise<void>(resolve => {
    resolveEvent = resolve;
  });

  function onMessage(ev: EventSourceMessage) {
    events.push(ev);
    if (resolveEvent) {
      resolveEvent();
    }
  }

  function onClose() {
    closed = true;
    if (resolveEvent) {
      resolveEvent();
    }
  }

  // Start the event source without awaiting its completion.
  fetchEventSource(`${backendUrl}/generation/generate_document`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        document_id: documentId,
        execution_id: executionId,
        user_instructions: userInstructions
    }),
    onmessage: onMessage,
    onclose: onClose,
  }).catch(err => {
    console.error('fetchEventSource error:', err);
    closed = true;
    if (resolveEvent) {
      resolveEvent();
    }
  });

  // Yield events as they arrive
  while (!closed || events.length > 0) {
    if (events.length === 0) {
      await eventPromise;
      // Reset the promise after being resolved
      eventPromise = new Promise<void>(resolve => {
        resolveEvent = resolve;
      });
    }
    while (events.length > 0) {
      yield events.shift();
    }
  }
}


export const generateDocument = async (params: GenerateStreamParams): Promise<void> => {
    if (!params) {
        throw new TypeError("streamGeneratedText: parámetro 'params' es undefined. Debes pasar un objeto con las propiedades requeridas.");
    }
    const { documentId, executionId, userInstructions,  onData, onInfo, onError, onClose } = params;

    try {
        for await (const event of fetchGeneration(documentId, executionId, userInstructions)) {
            console.log('Received event:', event);
            if (event.event === 'info') {
                try {
                    const normalized = event.data.replace(/'/g, '"');
                    const info = JSON.parse(normalized);
                    const sectionId = info.section_id;
                    console.log('Received section info:', sectionId);
                    onInfo(sectionId);
                } catch {
                    console.warn('Info SSE inválida:', event.data);
                }
            } else if (event.event === 'content') {
                console.log("Content: ", event.data);
                onData(event.data);
            }
        }
        onClose();
    } catch (error) {
        console.error('Error en la generación del documento:', error);
        onError(error as Event);
        onClose();
    }


}
