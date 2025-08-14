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

async function* fetchGeneration(
  documentId: string,
  executionId: string,
  userInstructions?: string,
  signal?: AbortSignal
): AsyncGenerator<any, void, unknown> {
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
        instructions: userInstructions
    }),
    onmessage: onMessage,
    onclose: onClose,
    // Abort support and error propagation
    signal,
    onerror(err) {
      console.error('SSE connection error:', err);
      events.push({ event: 'error', data: (err as Error)?.message || 'Connection error' });
      closed = true;
      if (resolveEvent) {
        resolveEvent();
      }
    }
  }).catch(err => {
    console.error('fetchEventSource error:', err);
    // Propagate as an error event and close
    events.push({ event: 'error', data: (err as Error)?.message || 'Connection error' });
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

    // Controller to allow cancelling the stream on error
    const controller = new AbortController();

    try {
        for await (const event of fetchGeneration(documentId, executionId, userInstructions, controller.signal)) {
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
            } else if (event.event === 'error') {
                console.error('Error SSE:', event.data);
                // Notify UI and cancel the stream immediately
                onError(new Event('error'));
                controller.abort();
                break;
            }
        }
        onClose();
    } catch (error) {
        console.error('Error en la generación del documento:', error);
        onError(error as Event);
        onClose();
    }
}


interface FixSectionParams {
    instructions: string;
    content: string;
    onData: (text: string) => void;
    onError: (error: Event) => void;
    onClose: () => void;
}

async function* fetchFixSection(
  instructions: string,
  content: string,
  signal?: AbortSignal
): AsyncGenerator<any, void, unknown> {
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
  fetchEventSource(`${backendUrl}/generation/fix_section`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        content: content,
        instructions: instructions
    }),
    onmessage: onMessage,
    onclose: onClose,
    // Abort support and error propagation
    signal,
    onerror(err) {
      console.error('SSE connection error:', err);
      events.push({ event: 'error', data: (err as Error)?.message || 'Connection error' });
      closed = true;
      if (resolveEvent) {
        resolveEvent();
      }
    }
  }).catch(err => {
    console.error('fetchEventSource error:', err);
    // Propagate as an error event and close
    events.push({ event: 'error', data: (err as Error)?.message || 'Connection error' });
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

export const fixSection = async (params: FixSectionParams): Promise<void> => {
    if (!params) {
        throw new TypeError("fixSection: parámetro 'params' es undefined. Debes pasar un objeto con las propiedades requeridas.");
    }
    const { instructions, content, onData, onError, onClose } = params;

    // Controller to allow cancelling the stream on error
    const controller = new AbortController();

    try {
        for await (const event of fetchFixSection(instructions, content, controller.signal)) {
            console.log('Received event:', event);
            if (event.event === 'content') {
                console.log("Content: ", event.data);
                onData(event.data);
            } else if (event.event === 'error') {
                console.error('Error SSE:', event.data);
                // Notify UI and cancel the stream immediately
                onError(new Event('error'));
                controller.abort();
                break;
            }
        }
        onClose();
    } catch (error) {
        console.error('Error en la corrección de la sección:', error);
        onError(error as Event);
        onClose();
    }
}
