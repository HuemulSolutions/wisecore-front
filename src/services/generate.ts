import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import { logger } from "@/lib/logger";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { EventSourceMessage } from "@microsoft/fetch-event-source";
import type { SSEEvent, GenerateStreamParams, GenerateWorkerParams, ExecuteGenerationParams, FixSectionParams, RedactPromptParams, ChatbotParams, EditWithAiParams, EditWithAiResponse } from "@/types/generate";

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
  const token = httpClient.getAuthToken();
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
    onerror(err) {
      logger.error("SSE connection error:", err);
      push({ event: "error", data: (err as Error)?.message || "Connection error" });
      closed = true;
      if (resolveEvent) {
        resolveEvent();
      }
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


async function* fetchGeneration(
  documentId: string,
  executionId: string,
  userInstructions?: string,
  organizationId?: string,
  signal?: AbortSignal
): AsyncGenerator<SSEEvent, void, unknown> {
  const additionalHeaders = organizationId ? { 'X-Org-Id': organizationId } : undefined;
  return yield* ssePostStream(
    `${backendUrl}/generation/generate_document`,
    {
      document_id: documentId,
      execution_id: executionId,
      instructions: userInstructions,
    },
    signal,
    additionalHeaders
  );
}


// New interface for the worker-based generation
export const generateDocumentWorker = async (params: GenerateWorkerParams): Promise<void> => {
    if (!params) {
        throw new TypeError("generateDocumentWorker: parameter 'params' is undefined. You must pass an object with the required properties.");
    }
    const { documentId, executionId, instructions, startSectionId, singleSectionMode, organizationId } = params;

    // Construct payload based on the execution mode
    const payload: Record<string, unknown> = {
        document_id: documentId,
        execution_id: executionId,
        instructions: instructions || '',
    };

    // Add optional parameters for different execution modes
    if (startSectionId) {
        payload.start_section_id = startSectionId;
    }

    if (singleSectionMode !== undefined) {
        payload.single_section_mode = singleSectionMode;
    }

    try {
        const response = await httpClient.post(`${backendUrl}/generation/generate_worker`, payload, {
            headers: {
                'X-Org-Id': organizationId,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        logger.log('Generation started successfully:', result);
    } catch (error) {
        logger.error('Error starting generation:', error);
        throw error;
    }
}

// Convenience functions for different generation modes

/**
 * Mode 1: Execute entire document
 * Requires: document_id, execution_id
 * Optional: instructions
 */
export const generateEntireDocument = async (
    documentId: string,
    executionId: string,
    organizationId: string,
    instructions?: string
): Promise<void> => {
    return generateDocumentWorker({
        documentId,
        executionId,
        instructions,
        organizationId,
    });
};

/**
 * Mode 2: Execute from a specific section onwards
 * Requires: document_id, execution_id, start_section_id
 * Optional: instructions
 */
export const generateFromSection = async (
    documentId: string,
    executionId: string,
    startSectionId: string,
    organizationId: string,
    instructions?: string
): Promise<void> => {
    return generateDocumentWorker({
        documentId,
        executionId,
        startSectionId,
        instructions,
        organizationId,
    });
};

/**
 * Mode 3: Execute only a specific section
 * Requires: document_id, execution_id, start_section_id, single_section_mode = true
 * Optional: instructions
 */
export const generateSingleSection = async (
    documentId: string,
    executionId: string,
    startSectionId: string,
    organizationId: string,
    instructions?: string
): Promise<void> => {
    return generateDocumentWorker({
        documentId,
        executionId,
        startSectionId,
        singleSectionMode: true,
        instructions,
        organizationId,
    });
};

/**
 * Mode 4: Execute first section only
 * Requires: document_id, execution_id, single_section_mode = true
 * Optional: instructions
 */
export const generateFirstSection = async (
    documentId: string,
    executionId: string,
    organizationId: string,
    instructions?: string
): Promise<void> => {
    return generateDocumentWorker({
        documentId,
        executionId,
        singleSectionMode: true,
        instructions,
        organizationId,
    });
};

/**
 * Generic AI text generation/edit endpoint (e.g. template section content or prompt).
 * Requires: text, prompt, organizationId
 * Optional: templateId, sectionId, llmId (falls back to the organization's default LLM)
 */
export const editWithAi = async (params: EditWithAiParams): Promise<string> => {
    if (!params) {
        throw new TypeError("editWithAi: parameter 'params' is undefined. You must pass an object with the required properties.");
    }

    const { text, prompt, templateId, sectionId, llmId, organizationId } = params;

    const payload: Record<string, unknown> = { text, prompt };
    if (templateId) payload.template_id = templateId;
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

// Legacy streaming function (kept for backward compatibility)
export const generateDocument = async (params: GenerateStreamParams): Promise<void> => {
    if (!params) {
        throw new TypeError("generateDocument: parameter 'params' is undefined. You must pass an object with the required properties.");
    }
    const { documentId, executionId, userInstructions, organizationId, signal, onData, onInfo, onError, onClose } = params;

    try {
        for await (const event of fetchGeneration(documentId, executionId, userInstructions, organizationId, signal)) {
            logger.log('Received event:', event);
            if (event.event === 'info') {
                try {
                    const normalized = event.data.replace(/'/g, '"');
                    const info = JSON.parse(normalized);
                    const sectionId = info.section_id;
                    logger.log('Received section info:', sectionId);
                    onInfo(sectionId);
                } catch {
                    logger.warn('Invalid info SSE:', event.data);
                }
            } else if (event.event === 'content') {
                logger.log("Content: ", event.data);
                onData(event.data);
            } else if (event.event === 'error') {
                logger.error('SSE Error:', event.data);
                onError(new Event('error'));
                break;
            }
        }
        onClose();
    } catch (error) {
        logger.error('Error generating document:', error);
        onError(error as Event);
        onClose();
    }
}


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

async function* fetchChatbot(
  executionId: string,
  user_message: string,
  organizationId: string,
  threadId?: string,
  signal?: AbortSignal
): AsyncGenerator<SSEEvent, void, unknown> {
  const additionalHeaders = { 'X-Org-Id': organizationId };
  return yield* ssePostStream(
    `${backendUrl}/chatbot`,
    { execution_id: executionId, user_message, thread_id: threadId },
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
                onError(new Event('error'));
                controller.abort();
                break;
            }
        }
        onClose();
    } catch (error) {
        logger.error('Error en la correcciÃ³n de la secciÃ³n:', error);
        onError(error as Event);
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
                onError(new Event('error'));
                controller.abort();
                break;
            }
        }
        onClose();
    } catch (error) {
        logger.error('Error en la redacciÃ³n del prompt:', error);
        onError(error as Event);
        onClose();
    }
}

export const chatbot = async (params: ChatbotParams): Promise<void> => {
    if (!params) {
        throw new TypeError("chatbot: parÃ¡metro 'params' es undefined. Debes pasar un objeto con las propiedades requeridas.");
    }
    const { executionId, user_message, threadId, organizationId, onData, onThreadId, onError, onClose } = params;

    // Controller to allow cancelling the stream on error
    const controller = new AbortController();

    try {
        for await (const event of fetchChatbot(executionId, user_message, organizationId, threadId, controller.signal)) {
            logger.log('Received event:', event);
            if (event.event === 'content') {
                logger.log("Content: ", event.data);
                onData(event.data);
            } else if (event.event === 'thread_id') {
                logger.log("Thread ID: ", event.data);
                onThreadId(event.data);
            } else if (event.event === 'error') {
                logger.error('Error SSE:', event.data);
                // Notify UI and cancel the stream immediately
                onError(new Event('error'));
                controller.abort();
                break;
            }
        }
        onClose();
    } catch (error) {
        logger.error('Error en el chatbot:', error);
        onError(error as Event);
        onClose();
    }
}
