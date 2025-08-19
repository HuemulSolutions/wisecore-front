import { backendUrl } from "@/config";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { EventSourceMessage } from "@microsoft/fetch-event-source";

// Generic SSE streaming helper to avoid duplication
// Unifies error handling, queueing and closing logic
// Types
 type SSEErrorEvent = { event: "error"; data: string };
 type SSEEvent = EventSourceMessage | SSEErrorEvent;

async function* ssePostStream(
  url: string,
  payload: unknown,
  signal?: AbortSignal
): AsyncGenerator<SSEEvent, void, unknown> {
  const events: SSEEvent[] = [];
  let closed = false;
  let resolveEvent: (() => void) | null = null;
  let eventPromise = new Promise<void>((resolve) => {
    resolveEvent = resolve;
  });

  function push(e: SSEEvent) {
    events.push(e);
    if (resolveEvent) {
      resolveEvent();
    }
  }

  function onMessage(ev: EventSourceMessage) {
    push(ev);
  }

  function onClose() {
    closed = true;
    if (resolveEvent) {
      resolveEvent();
    }
  }

  fetchEventSource(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    onmessage: onMessage,
    onclose: onClose,
    signal,
    onerror(err) {
      console.error("SSE connection error:", err);
      push({ event: "error", data: (err as Error)?.message || "Connection error" });
      closed = true;
      if (resolveEvent) {
        resolveEvent();
      }
    },
  }).catch((err) => {
    console.error("fetchEventSource error:", err);
    push({ event: "error", data: (err as Error)?.message || "Connection error" });
    closed = true;
    if (resolveEvent) {
      resolveEvent();
    }
  });

  while (!closed || events.length > 0) {
    if (events.length === 0) {
      await eventPromise;
      eventPromise = new Promise<void>((resolve) => {
        resolveEvent = resolve;
      });
    }
    while (events.length > 0) {
      yield events.shift() as SSEEvent;
    }
  }
}


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
): AsyncGenerator<SSEEvent, void, unknown> {
  return yield* ssePostStream(
    `${backendUrl}/generation/generate_document`,
    {
      document_id: documentId,
      execution_id: executionId,
      instructions: userInstructions,
    },
    signal
  );
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

interface RedactPromptParams {
    name: string;
    content?: string;
    onData: (text: string) => void;
    onError: (error: Event) => void;
    onClose: () => void;
}

async function* fetchFixSection(
  instructions: string,
  content: string,
  signal?: AbortSignal
): AsyncGenerator<SSEEvent, void, unknown> {
  return yield* ssePostStream(
    `${backendUrl}/generation/fix_section`,
    { content, instructions },
    signal
  );
}

async function* fetchRedactPrompt(
  name: string,
  content?: string,
  signal?: AbortSignal
): AsyncGenerator<SSEEvent, void, unknown> {
  return yield* ssePostStream(
    `${backendUrl}/generation/redact_section_prompt`,
    { name, content },
    signal
  );
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

export const redactPrompt = async (params: RedactPromptParams): Promise<void> => {
    if (!params) {
        throw new TypeError("redactPrompt: parámetro 'params' es undefined. Debes pasar un objeto con las propiedades requeridas.");
    }
    const { name, content, onData, onError, onClose } = params;

    // Controller to allow cancelling the stream on error
    const controller = new AbortController();

    try {
        for await (const event of fetchRedactPrompt(name, content, controller.signal)) {
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
        console.error('Error en la redacción del prompt:', error);
        onError(error as Event);
        onClose();
    }
}
