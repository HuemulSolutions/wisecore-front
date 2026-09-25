import type { ConversationReference, WorkingContextItem, ChatMessage, MessageStatus } from './core'

export interface UseChatbotProps {
  references?: ConversationReference[];
  selectedLlmId?: string;
  workingContextItems?: WorkingContextItem[];
}

export interface UseChatbotReturn {
  conversationId: string | null;
  conversationTitle: string | null;
  setConversationTitle: (title: string | null) => void;
  messages: ChatMessage[];
  assistantMessage: ChatMessage | null;
  isTyping: boolean;
  sendMessage: (content: string) => void;
  startNewConversation: () => void;
  /** Internal alias of startNewConversation used by ChatbotProvider's org-change reset. */
  resetChatbot: () => void;
  loadConversation: (conversationId: string) => void;
  isSending: boolean;
  isLoadingConversation: boolean;
}

export interface UseMessagePollingProps {
  conversationId: string | null
  assistantMessageId: string | null
  onComplete?: (message: ChatMessage) => void
  onError?: (message: ChatMessage) => void
}

export interface UseMessagePollingReturn {
  message: ChatMessage | null
  status: MessageStatus | null
  isPolling: boolean
  error: Error | null
  stopPolling: () => void
}
