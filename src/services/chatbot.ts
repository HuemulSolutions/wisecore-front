import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import type {
  Conversation,
  ConversationWithDetail,
  CreateConversationRequest,
  ConversationReference,
  ChatMessage,
  ChatPaginatedResponse,
  SendMessageResponse,
  ArchiveConversationResponse,
  SendMessageRequest,
} from "@/types/chatbot";

const CHATBOT_BASE = `${backendUrl}/chatbot`;

// ========================================
// Conversations
// ========================================

/**
 * Crea una nueva conversacion.
 */
export async function createConversation(
  params?: CreateConversationRequest
): Promise<Conversation> {
  const response = await httpClient.post(`${CHATBOT_BASE}/conversations`, params ?? {});
  const json = await response.json();
  return json.data;
}

/**
 * Lista las conversaciones activas del usuario, ordenadas por updated_at desc.
 */
export async function listConversations(
  page: number = 1,
  pageSize: number = 20
): Promise<ChatPaginatedResponse<Conversation>> {
  const response = await httpClient.get(
    `${CHATBOT_BASE}/conversations?page=${page}&page_size=${pageSize}`
  );
  const json = await response.json();
  return {
    items: json.data,
    page: json.page,
    pageSize: json.page_size,
    hasNext: json.has_next,
  };
}

/**
 * Obtiene el detalle de una conversacion con sus mensajes y ultimo mensaje.
 */
export async function getConversation(
  conversationId: string
): Promise<ConversationWithDetail> {
  const response = await httpClient.get(
    `${CHATBOT_BASE}/conversations/${conversationId}`
  );
  const json = await response.json();
  return json.data;
}

/**
 * Actualiza el titulo de una conversacion.
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<Conversation> {
  const response = await httpClient.patch(
    `${CHATBOT_BASE}/conversations/${conversationId}/title`,
    { title }
  );
  const json = await response.json();
  return json.data;
}

/**
 * Archiva una conversacion (soft delete definitivo, no hay restore).
 */
export async function archiveConversation(
  conversationId: string
): Promise<ArchiveConversationResponse> {
  const response = await httpClient.delete(
    `${CHATBOT_BASE}/conversations/${conversationId}`
  );
  const json = await response.json();
  return json.data;
}

// ========================================
// Messages
// ========================================

/**
 * Envia un mensaje del usuario y encola la generacion de respuesta del assistant.
 * Retorna los IDs para hacer polling del assistant_message_id.
 * Si se proporcionan references, el backend actualiza el contexto de la conversacion.
 */
export async function sendMessage(
  conversationId: string,
  content: string,
  references?: ConversationReference[],
  llmId?: string
): Promise<SendMessageResponse> {
  const body: SendMessageRequest = { content };
  if (references && references.length > 0) {
    body.references = references;
  }
  if (llmId) {
    body.llm_id = llmId;
  }
  const response = await httpClient.post(
    `${CHATBOT_BASE}/conversations/${conversationId}/messages`,
    body
  );
  const json = await response.json();
  return json.data;
}

/**
 * Lista mensajes de una conversacion en orden cronologico ascendente.
 */
export async function listMessages(
  conversationId: string,
  page: number = 1,
  pageSize: number = 50
): Promise<ChatPaginatedResponse<ChatMessage>> {
  const response = await httpClient.get(
    `${CHATBOT_BASE}/conversations/${conversationId}/messages?page=${page}&page_size=${pageSize}`
  );
  const json = await response.json();
  return {
    items: json.data,
    page: json.page,
    pageSize: json.page_size,
    hasNext: json.has_next,
  };
}

/**
 * Obtiene un mensaje especifico. Endpoint principal para polling del status
 * de la respuesta del assistant.
 */
export async function getMessage(
  conversationId: string,
  messageId: string
): Promise<ChatMessage> {
  const response = await httpClient.get(
    `${CHATBOT_BASE}/conversations/${conversationId}/messages/${messageId}`
  );
  const json = await response.json();
  return json.data;
}
