import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useChatbot } from '@/hooks/use-chatbot';
import type { ConversationReference, WorkingContextItem } from '@/types/chatbot';
import type {
  ChatView,
  ChatbotContextValue,
  ChatbotProviderProps,
  ReferenceSourceState,
  UseChatbotScreenContextOptions,
} from '@/types/chatbot'
export type { ChatView, ChatbotContextValue }

const ChatbotContext = createContext<ChatbotContextValue | undefined>(undefined);

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
  const [workingContextItems, setWorkingContextItems] = useState<WorkingContextItem[]>([]);
  const [currentPageContext, setCurrentPageContext] = useState<WorkingContextItem | null>(null);
  const sourceOrderRef = useRef(0);

  const setReferences = useCallback((references?: ConversationReference[]) => {
    setFallbackReferences(references);
  }, []);

  const addWorkingContextItem = useCallback((item: WorkingContextItem) => {
    setWorkingContextItems((prev) => {
      if (prev.some((i) => i.type === item.type && i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeWorkingContextItem = useCallback((type: string, id: string) => {
    setWorkingContextItems((prev) => prev.filter((i) => !(i.type === type && i.id === id)));
  }, []);

  const clearWorkingContextItems = useCallback(() => {
    setWorkingContextItems([]);
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

  const chatbotState = useChatbot({ references, selectedLlmId, workingContextItems });

  const value = useMemo<ChatbotContextValue>(
    () => ({
      references,
      setReferences,
      registerReferenceSource,
      unregisterReferenceSource,
      workingContextItems,
      addWorkingContextItem,
      removeWorkingContextItem,
      clearWorkingContextItems,
      currentPageContext,
      setCurrentPageContext,
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
      conversationTitle: chatbotState.conversationTitle,
      setConversationTitle: chatbotState.setConversationTitle,
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
      workingContextItems,
      addWorkingContextItem,
      removeWorkingContextItem,
      clearWorkingContextItems,
      currentPageContext,
      isOpen,
      isExpanded,
      inputValue,
      view,
      selectedLlmId,
      chatbotState.conversationId,
      chatbotState.conversationTitle,
      chatbotState.setConversationTitle,
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
