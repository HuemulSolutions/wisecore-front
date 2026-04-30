// Chatbot module types
// API: /api/v1/chatbot

// ========================================
// Enums / Union types
// ========================================

export type ConversationStatus = 'active' | 'archived';

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export type MessageStatus = 'pending' | 'completed' | 'error' | 'streaming';

// ========================================
// Core models
// ========================================

/**
 * Reference contextual asociada a una conversacion.
 * El backend no valida los IDs ni los tipos — es metadata libre.
 */
export interface ConversationReference {
  type: string;
  id: string;
}

/**
 * Working context item with display name for UI rendering.
 */
export interface WorkingContextItem extends ConversationReference {
  name: string;
}

/**
 * Conversacion del chatbot.
 */
export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  references: ConversationReference[] | null;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * Conversacion con detalle (incluye mensajes y ultimo mensaje).
 * Retornada por GET /conversations/{id}.
 */
export interface ConversationWithDetail extends Conversation {
  messages: ChatMessage[];
  last_message: ChatMessage | null;
  last_working_context: ConversationReference[];
}

/**
 * Metadata de un mensaje del assistant.
 */
export interface ChatMessageProgressMetadata {
  state: 'running_tools';
  tool_message: string;
  tool_call_count: number;
  has_multiple_tool_calls: boolean;
}

export interface ChatMessageMetadata {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  llm_id?: string;
  llm_name?: string;
  error?: string;
  progress?: ChatMessageProgressMetadata | null;
}

/**
 * LLM info attached to a completed assistant message.
 */
export interface ChatMessageLlm {
  id: string;
  name: string;
}

/**
 * Mensaje dentro de una conversacion.
 */
export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string | null;
  metadata: ChatMessageMetadata | null;
  status: MessageStatus;
  llm: ChatMessageLlm | null;
  /** Working context items attached when the message was sent (local-only, not persisted by backend). */
  working_context_items?: WorkingContextItem[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// ========================================
// Request types
// ========================================

export interface CreateConversationRequest {
  title?: string;
}

export interface SendMessageRequest {
  content: string;
  /** @deprecated Only for backward compatibility — use working_context instead. */
  references?: ConversationReference[];
  /** Contextual items for this turn (documents, executions, folders, etc.). */
  working_context?: ConversationReference[];
  /** Optional LLM override for the next assistant response generation. */
  llm_id?: string;
}

export interface UpdateTitleRequest {
  title: string;
}

export interface UpdateReferencesRequest {
  references: ConversationReference[];
}

// ========================================
// Response types
// ========================================

/**
 * Respuesta paginada del backend.
 */
export interface ChatPaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  hasNext: boolean;
}

/**
 * Respuesta de POST /conversations/{id}/messages (202 Accepted).
 * Contiene los IDs para hacer polling.
 */
export interface SendMessageResponse {
  conversation_id: string;
  message_id: string;
  assistant_message_id: string;
  working_context: ConversationReference[];
}

/**
 * Respuesta de DELETE /conversations/{id}.
 */
export interface ArchiveConversationResponse {
  conversation_id: string;
}
