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
  error?: string;
  progress?: ChatMessageProgressMetadata;
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
  references?: ConversationReference[];
}

export interface SendMessageRequest {
  content: string;
  /** References to associate with this message (e.g. current document/execution context). */
  references?: ConversationReference[];
  /** Optional LLM override for the next assistant response generation. */
  llm_id?: string;
}

export interface UpdateTitleRequest {
  title: string;
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
}

/**
 * Respuesta de DELETE /conversations/{id}.
 */
export interface ArchiveConversationResponse {
  conversation_id: string;
}
