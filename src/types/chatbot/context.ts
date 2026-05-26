import type { PropsWithChildren } from 'react'
import type { ChatMessage, ConversationReference, WorkingContextItem } from './core'

export type ChatView = 'chat' | 'history';

export interface ChatbotContextValue {
  references?: ConversationReference[];
  setReferences: (references?: ConversationReference[]) => void;
  registerReferenceSource: (sourceKey: string, references?: ConversationReference[], priority?: number) => void;
  unregisterReferenceSource: (sourceKey: string) => void;
  workingContextItems: WorkingContextItem[];
  addWorkingContextItem: (item: WorkingContextItem) => void;
  removeWorkingContextItem: (type: string, id: string) => void;
  clearWorkingContextItems: () => void;
  currentPageContext: WorkingContextItem | null;
  setCurrentPageContext: (item: WorkingContextItem | null) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  view: ChatView;
  setView: (view: ChatView) => void;
  selectedLlmId?: string;
  setSelectedLlmId: (llmId?: string) => void;
  conversationId: string | null;
  conversationTitle: string | null;
  setConversationTitle: (title: string | null) => void;
  messages: ChatMessage[];
  assistantMessage: ChatMessage | null;
  isTyping: boolean;
  sendMessage: (content: string) => void;
  startNewConversation: () => void;
  loadConversation: (conversationId: string) => void;
  isSending: boolean;
  isLoadingConversation: boolean;
}

export interface ChatbotProviderProps extends PropsWithChildren {
  executionId?: string;
  documentId?: string;
  initialReferences?: ConversationReference[];
}

export interface ReferenceSourceState {
  references?: ConversationReference[];
  priority: number;
  order: number;
}

export interface UseChatbotScreenContextOptions {
  sourceKey: string;
  references?: ConversationReference[];
  enabled?: boolean;
  priority?: number;
}
