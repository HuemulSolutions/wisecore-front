import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useChatbot } from '@/hooks/use-chatbot';
import type { ChatMessage, ConversationReference } from '@/types/chatbot';

export type ChatView = 'chat' | 'history';

export interface ChatbotContextValue {
  references?: ConversationReference[];
  setReferences: (references?: ConversationReference[]) => void;
  registerReferenceSource: (sourceKey: string, references?: ConversationReference[], priority?: number) => void;
  unregisterReferenceSource: (sourceKey: string) => void;
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
  messages: ChatMessage[];
  assistantMessage: ChatMessage | null;
  isTyping: boolean;
  sendMessage: (content: string) => void;
  startNewConversation: () => void;
  loadConversation: (conversationId: string) => void;
  isSending: boolean;
  isLoadingConversation: boolean;
}

interface ChatbotProviderProps extends PropsWithChildren {
  executionId?: string;
  documentId?: string;
  initialReferences?: ConversationReference[];
}

const ChatbotContext = createContext<ChatbotContextValue | undefined>(undefined);

interface ReferenceSourceState {
  references?: ConversationReference[];
  priority: number;
  order: number;
}

function buildReferences(
  executionId?: string,
  documentId?: string,
  initialReferences?: ConversationReference[]
): ConversationReference[] | undefined {
  if (initialReferences && initialReferences.length > 0) {
    return initialReferences;
  }

  if (executionId) {
    return [{ type: 'execution', id: executionId }];
  }

  if (documentId) {
    return [{ type: 'document', id: documentId }];
  }

  return undefined;
}

export function ChatbotProvider({
  children,
  executionId,
  documentId,
  initialReferences,
}: ChatbotProviderProps) {
  const [fallbackReferences, setFallbackReferences] = useState<ConversationReference[] | undefined>(() =>
    buildReferences(executionId, documentId, initialReferences)
  );
  const [referenceSources, setReferenceSources] = useState<Record<string, ReferenceSourceState>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [view, setView] = useState<ChatView>('chat');
  const [selectedLlmId, setSelectedLlmId] = useState<string>();
  const sourceOrderRef = useRef(0);

  const setReferences = useCallback((references?: ConversationReference[]) => {
    setFallbackReferences(references);
  }, []);

  const registerReferenceSource = useCallback(
    (sourceKey: string, references?: ConversationReference[], priority = 0) => {
      setReferenceSources((prev) => ({
        ...prev,
        [sourceKey]: {
          references,
          priority,
          order: sourceOrderRef.current++,
        },
      }));
    },
    []
  );

  const unregisterReferenceSource = useCallback((sourceKey: string) => {
    setReferenceSources((prev) => {
      if (!(sourceKey in prev)) {
        return prev;
      }

      const next = { ...prev };
      delete next[sourceKey];
      return next;
    });
  }, []);

  useEffect(() => {
    setFallbackReferences(buildReferences(executionId, documentId, initialReferences));
  }, [documentId, executionId, initialReferences]);

  const references = useMemo(() => {
    const activeSource = Object.values(referenceSources).sort((left, right) => {
      if (left.priority !== right.priority) {
        return right.priority - left.priority;
      }

      return right.order - left.order;
    })[0];

    return activeSource?.references ?? fallbackReferences;
  }, [fallbackReferences, referenceSources]);

  const chatbotState = useChatbot({ references, selectedLlmId });

  const value = useMemo<ChatbotContextValue>(
    () => ({
      references,
      setReferences,
      registerReferenceSource,
      unregisterReferenceSource,
      isOpen,
      setIsOpen,
      isExpanded,
      setIsExpanded,
      inputValue,
      setInputValue,
      view,
      setView,
      selectedLlmId,
      setSelectedLlmId,
      conversationId: chatbotState.conversationId,
      messages: chatbotState.messages,
      assistantMessage: chatbotState.assistantMessage,
      isTyping: chatbotState.isTyping,
      sendMessage: chatbotState.sendMessage,
      startNewConversation: chatbotState.startNewConversation,
      loadConversation: chatbotState.loadConversation,
      isSending: chatbotState.isSending,
      isLoadingConversation: chatbotState.isLoadingConversation,
    }),
    [
      references,
      setReferences,
      registerReferenceSource,
      unregisterReferenceSource,
      isOpen,
      isExpanded,
      inputValue,
      view,
      selectedLlmId,
      chatbotState.conversationId,
      chatbotState.messages,
      chatbotState.assistantMessage,
      chatbotState.isTyping,
      chatbotState.sendMessage,
      chatbotState.startNewConversation,
      chatbotState.loadConversation,
      chatbotState.isSending,
      chatbotState.isLoadingConversation,
    ]
  );

  return <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>;
}

export function useChatbotContext() {
  const context = useContext(ChatbotContext);

  if (context === undefined) {
    throw new Error('useChatbotContext must be used within a ChatbotProvider');
  }

  return context;
}

export function useOptionalChatbotContext() {
  return useContext(ChatbotContext);
}

interface UseChatbotScreenContextOptions {
  sourceKey: string;
  references?: ConversationReference[];
  enabled?: boolean;
  priority?: number;
}

export function useChatbotScreenContext({
  sourceKey,
  references,
  enabled = true,
  priority = 0,
}: UseChatbotScreenContextOptions) {
  const { registerReferenceSource, unregisterReferenceSource } = useChatbotContext();

  useEffect(() => {
    if (!enabled) {
      unregisterReferenceSource(sourceKey);
      return;
    }

    registerReferenceSource(sourceKey, references, priority);

    return () => {
      unregisterReferenceSource(sourceKey);
    };
  }, [enabled, priority, references, registerReferenceSource, sourceKey, unregisterReferenceSource]);
}
