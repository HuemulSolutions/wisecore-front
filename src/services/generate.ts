import { ApiError } from "@/types/api-error";
import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import { logger } from "@/lib/logger";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { EventSourceMessage } from "@microsoft/fetch-event-source";
import type { SSEEvent, ExecuteGenerationParams, FixSectionParams, RedactPromptParams, EditWithAiParams, EditWithAiResponse } from "@/types/generate";

// Generic SSE streaming helper to avoid duplication
// Unifies error handling, queueing and closing logic

async function* ssePostStream(
  url: string,
  payload: unknown,
  signal?: AbortSignal,
  additionalHeaders?: Record<string, string>
): AsyncGenerator<SSEEvent, void, unknown> {
  const events: SSEEvent[] = [];
  let closed = false;
  let resolveEvent: (() => void) | null = null;
  let eventPromise: Promise<void> | null = null;

  function createEventPromise() {
    return new Promise<void>((resolve) => {
      resolveEvent = resolve;
    });
  }

  eventPromise = createEventPromise();

  function push(e: SSEEvent) {
    events.push(e);
    if (resolveEvent) {
      resolveEvent();
      eventPromise = createEventPromise();
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

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  // Estas rutas son de la organización: el backend lee los permisos del token de organización
  // (el de login no trae `permissions` ni `is_org_admin` y recibe 403), igual que `http-client`.
  const token = httpClient.getOrganizationToken() || httpClient.getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  // Add additional headers if provided
  if (additionalHeaders) {
    Object.assign(headers, additionalHeaders);
  }

  fetchEventSource(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    onmessage: onMessage,
    onclose: onClose,
    signal,
    async onopen(response) {
      if (response.ok) return;
      // Un 4xx/5xx trae el error uniforme del backend: se propaga como `ApiError` (código,
      // mensaje y detalle) en vez del "Expected content-type" genérico de la librería.
      throw await ApiError.fromResponse(response, `HTTP ${response.status}`);
    },
    onerror(err) {
      logger.error("SSE connection error:", err);
      push({
        event: "error",
        data: (err as Error)?.message || "Connection error",
        error: err instanceof Error ? err : undefined,
      });
      closed = true;
      if (resolveEvent) {
        resolveEvent();
      }
      // Relanzar corta los reintentos automáticos de fetchEventSource: sin esto, un 403
      // se repetía cada segundo hasta que alguien abortara la señal.
      throw err;
    },
  }).catch((err) => {
    logger.error("fetchEventSource error:", err);
    push({ event: "error", data: (err as Error)?.message || "Connection error" });
    closed = true;
    if (resolveEvent) {
      resolveEvent();
    }
  });

  while (!closed || events.length > 0) {
    if (events.length === 0 && !closed) {
      await eventPromise;
    }
    
    // Process all available events at once to reduce iterations
    const currentEvents = events.splice(0, events.length);
    for (const event of currentEvents) {
      yield event;
    }
  }
}


export const editWithAi = async (params: EditWithAiParams): Promise<string> => {
    if (!params) {
        throw new TypeError("editWithAi: parameter 'params' is undefined. You must pass an object with the required properties.");
    }

    const { text, prompt, templateId, sectionId, executionId, llmId, organizationId } = params;

    const payload: Record<string, unknown> = { text, prompt };
    if (templateId) {
        payload.template_id = templateId;
    } else if (executionId) {
        payload.execution_id = executionId;
    }
    if (sectionId) payload.section_id = sectionId;
    if (llmId) payload.llm_id = llmId;

    const response = await httpClient.post(`${backendUrl}/generation/edit_with_ai`, payload, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    const result = (await response.json()) as EditWithAiResponse;
    return result.data.text;
};

/**
 * Execute generation using the new /execution/generate endpoint
 * Supports both single section and from-section execution modes
 */
export const executeGeneration = async (params: ExecuteGenerationParams): Promise<void> => {
    if (!params) {
        throw new TypeError("executeGeneration: parameter 'params' is undefined. You must pass an object with the required properties.");
    }
    
    const { documentId, executionId, sectionId, mode, instructions, llmModel, organizationId } = params;

    const payload: Record<string, unknown> = {
        document_id: documentId,
        execution_id: executionId,
        llm_id: llmModel,
        instructions: instructions || '',
    };

    // Add section-specific parameters based on mode
    if (mode === 'single' && sectionId) {
        payload.section_id = sectionId;
        payload.single_section_mode = true;
    } else if (mode === 'from' && sectionId) {
        payload.start_section_id = sectionId;
        payload.single_section_mode = false;
    }

    try {
        const response = await httpClient.post(`${backendUrl}/execution/generate`, payload, {
            headers: {
                'X-Org-Id': organizationId,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        logger.log('Execution started successfully:', result);
    } catch (error) {
        logger.error('Error starting execution:', error);
        throw error;
    }
};

/**
 * Convenience function for executing a single section
 */
export const executeSingleSection = async (
    documentId: string,
    executionId: string,
    sectionId: string,
    organizationId: string,
    llmModel: string,
    instructions?: string
): Promise<void> => {
    return executeGeneration({
        documentId,
        executionId,
        sectionId,
        mode: 'single',
        instructions,
        llmModel,
        organizationId,
    });
};

/**
 * Convenience function for executing from a specific section onwards
 */
export const executeFromSection = async (
    documentId: string,
    executionId: string,
    sectionId: string,
    organizationId: string,
    llmModel: string,
    instructions?: string
): Promise<void> => {
    return executeGeneration({
        documentId,
        executionId,
        sectionId,
        mode: 'from',
        instructions,
        llmModel,
        organizationId,
    });
};

async function* fetchFixSection(
  instructions: string,
  content: string,
  organizationId: string,
  signal?: AbortSignal
): AsyncGenerator<SSEEvent, void, unknown> {
  const additionalHeaders = { 'X-Org-Id': organizationId };
  return yield* ssePostStream(
    `${backendUrl}/generation/fix_section`,
    { content, instructions },
    signal,
    additionalHeaders
  );
}

async function* fetchRedactPrompt(
  name: string,
  content: string | undefined,
  organizationId: string,
  signal?: AbortSignal
): AsyncGenerator<SSEEvent, void, unknown> {
  const additionalHeaders = { 'X-Org-Id': organizationId };
  return yield* ssePostStream(
    `${backendUrl}/generation/redact_section_prompt`,
    { name, content },
    signal,
    additionalHeaders
  );
}

export const fixSection = async (params: FixSectionParams): Promise<void> => {
    if (!params) {
        throw new TypeError("fixSection: parÃ¡metro 'params' es undefined. Debes pasar un objeto con las propiedades requeridas.");
    }
    const { instructions, content, organizationId, onData, onError, onClose } = params;

    // Controller to allow cancelling the stream on error
    const controller = new AbortController();

    try {
        for await (const event of fetchFixSection(instructions, content, organizationId, controller.signal)) {
            logger.log('Received event:', event);
            if (event.event === 'content') {
                logger.log("Content: ", event.data);
                onData(event.data);
            } else if (event.event === 'error') {
                logger.error('Error SSE:', event.data);
                // Notify UI and cancel the stream immediately
                onError(('error' in event && event.error) || new Error(event.data));
                controller.abort();
                break;
            }
        }
        onClose();
    } catch (error) {
        logger.error('Error en la correcciÃ³n de la secciÃ³n:', error);
        onError(error instanceof Error ? error : new Error(String(error)));
        onClose();
    }
}

export const redactPrompt = async (params: RedactPromptParams): Promise<void> => {
    if (!params) {
        throw new TypeError("redactPrompt: parÃ¡metro 'params' es undefined. Debes pasar un objeto con las propiedades requeridas.");
    }
    const { name, content, organizationId, onData, onError, onClose } = params;

    // Controller to allow cancelling the stream on error
    const controller = new AbortController();

    try {
        for await (const event of fetchRedactPrompt(name, content, organizationId, controller.signal)) {
            logger.log('Received event:', event);
            if (event.event === 'content') {
                logger.log("Content: ", event.data);
                onData(event.data);
            } else if (event.event === 'error') {
                logger.error('Error SSE:', event.data);
                // Notify UI and cancel the stream immediately
                onError(('error' in event && event.error) || new Error(event.data));
                controller.abort();
                break;
            }
        }
        onClose();
    } catch (error) {
        logger.error('Error en la redacciÃ³n del prompt:', error);
        onError(error instanceof Error ? error : new Error(String(error)));
        onClose();
    }
}
