import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef } from "react";
import {
  createConversation,
  getConversation,
  sendMessage as sendMessageService,
  updateConversationTitle,
} from "@/services/chatbot";
import { useMessagePolling } from "@/hooks/use-message-polling";
import type {
  ChatMessage,
  ConversationReference,
  SendMessageResponse,
} from "@/types/chatbot";

// ========================================
// Query keys
// ========================================

export const chatbotQueryKeys = {
  all: ["chatbot"] as const,
  conversations: () => [...chatbotQueryKeys.all, "conversations"] as const,
  conversation: (id: string) =>
    [...chatbotQueryKeys.all, "conversation", id] as const,
};

// ========================================
// Constants
// ========================================

const AUTO_TITLE_MAX_LENGTH = 50;

// ========================================
// Helpers
// ========================================

/**
 * Build an optimistic ChatMessage for immediate UI display.
 */
function buildOptimisticMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string | null,
  status: "completed" | "pending" = "completed"
): ChatMessage {
  const now = new Date().toISOString();
  return {
    id: `optimistic-${role}-${Date.now()}`,
    conversation_id: conversationId,
    role,
    content,
    metadata: null,
    status,
    created_at: now,
    updated_at: now,
    created_by: null,
    updated_by: null,
  };
}

/**
 * Generate an auto-title from the first user message.
 */
function generateAutoTitle(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= AUTO_TITLE_MAX_LENGTH) return trimmed;
  return trimmed.slice(0, AUTO_TITLE_MAX_LENGTH).trimEnd() + "…";
}

// ========================================
// Hook
// ========================================

interface UseChatbotProps {
  /**
   * References representing the user's current context (document/execution).
   * Sent with every message so the backend keeps context up to date.
   * Also used when creating a new conversation.
   */
  references?: ConversationReference[];
}

interface UseChatbotReturn {
  /** Current conversation ID (null if no active conversation) */
  conversationId: string | null;
  /** Messages to render — includes optimistic entries */
  messages: ChatMessage[];
  /** True while the assistant is generating a response (polling active) */
  isTyping: boolean;

  /** Send a user message. Creates a conversation first if needed. */
  sendMessage: (content: string) => void;
  /** Start a fresh conversation, clearing current state */
  startNewConversation: () => void;
  /** Load an existing conversation by ID */
  loadConversation: (conversationId: string) => void;

  /** True while the sendMessage mutation is in-flight */
  isSending: boolean;
  /** True while loading an existing conversation's messages */
  isLoadingConversation: boolean;
}

export function useChatbot({
  references,
}: UseChatbotProps = {}): UseChatbotReturn {
  const queryClient = useQueryClient();

  // ── Core state ──────────────────────────────────────────────
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingAssistantId, setPendingAssistantId] = useState<string | null>(
    null
  );

  // Track whether the first message has been sent (for auto-title)
  const isFirstMessageRef = useRef(true);
  // Guard against duplicate send while creating conversation
  const isSendingRef = useRef(false);

  // ── Load existing conversation ──────────────────────────────
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  // ── Polling for assistant response ──────────────────────────
  const handlePollingComplete = useCallback(
    (completedMessage: ChatMessage) => {
      // Replace the optimistic assistant placeholder with the real message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id.startsWith("optimistic-assistant")
            ? completedMessage
            : msg
        )
      );
      setPendingAssistantId(null);
    },
    []
  );

  const handlePollingError = useCallback(
    (errorMessage: ChatMessage) => {
      // Replace placeholder with the errored message so the UI can show the error state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id.startsWith("optimistic-assistant")
            ? errorMessage
            : msg
        )
      );
      setPendingAssistantId(null);
    },
    []
  );

  const { isPolling } = useMessagePolling({
    conversationId,
    assistantMessageId: pendingAssistantId,
    onComplete: handlePollingComplete,
    onError: handlePollingError,
  });

  // ── Send message mutation ───────────────────────────────────
  const sendMutation = useMutation<
    SendMessageResponse,
    Error,
    { conversationId: string; content: string; references?: ConversationReference[] }
  >({
    mutationFn: ({ conversationId: convId, content, references: refs }) =>
      sendMessageService(convId, content, refs),
    onSuccess: (data, variables) => {
      // Replace the optimistic user message ID with the real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id.startsWith("optimistic-user")
            ? { ...msg, id: data.message_id }
            : msg
        )
      );

      // Start polling for the assistant's response
      setPendingAssistantId(data.assistant_message_id);

      // Auto-title on first message
      if (isFirstMessageRef.current) {
        isFirstMessageRef.current = false;
        const title = generateAutoTitle(variables.content);
        updateConversationTitle(data.conversation_id, title).then(() => {
          queryClient.invalidateQueries({
            queryKey: chatbotQueryKeys.conversations(),
          });
        });
      }

      isSendingRef.current = false;
    },
    onError: () => {
      // Remove the optimistic messages on error
      setMessages((prev) =>
        prev.filter(
          (msg) =>
            !msg.id.startsWith("optimistic-user") &&
            !msg.id.startsWith("optimistic-assistant")
        )
      );
      isSendingRef.current = false;
    },
  });

  // ── Public actions ──────────────────────────────────────────

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isSendingRef.current) return;
      isSendingRef.current = true;

      let activeConversationId = conversationId;

      // If no active conversation, create one first
      if (!activeConversationId) {
        try {
          const conv = await createConversation({
            references,
          });
          activeConversationId = conv.id;
          setConversationId(conv.id);

          // Invalidate conversations list so it picks up the new one
          queryClient.invalidateQueries({
            queryKey: chatbotQueryKeys.conversations(),
          });
        } catch {
          isSendingRef.current = false;
          return; // Global error handler will show toast
        }
      }

      // Add optimistic messages
      const optimisticUser = buildOptimisticMessage(
        activeConversationId,
        "user",
        trimmed
      );
      const optimisticAssistant = buildOptimisticMessage(
        activeConversationId,
        "assistant",
        null,
        "pending"
      );
      setMessages((prev) => [...prev, optimisticUser, optimisticAssistant]);

      // Fire the mutation — include references so backend updates context on every message
      sendMutation.mutate({
        conversationId: activeConversationId,
        content: trimmed,
        references,
      });
    },
    [conversationId, references, queryClient, sendMutation]
  );

  const startNewConversation = useCallback(
    () => {
      // Reset all state — conversation will be created lazily on first message.
      // References are passed via the `references` prop and re-sent on every message.
      setConversationId(null);
      setMessages([]);
      setPendingAssistantId(null);
      setIsLoadingConversation(false);
      isFirstMessageRef.current = true;
      isSendingRef.current = false;
    },
    []
  );

  const loadConversation = useCallback(
    async (targetConversationId: string) => {
      // Reset polling state
      setPendingAssistantId(null);
      isSendingRef.current = false;

      setConversationId(targetConversationId);
      setIsLoadingConversation(true);

      try {
        const detail = await getConversation(targetConversationId);
        setMessages(detail.messages ?? []);
        // If the conversation already has messages, it's not the first message
        isFirstMessageRef.current =
          !detail.messages || detail.messages.length === 0;
      } catch {
        // Global error handler shows toast
        setMessages([]);
      } finally {
        setIsLoadingConversation(false);
      }
    },
    []
  );

  return {
    conversationId,
    messages,
    isTyping: isPolling,

    sendMessage,
    startNewConversation,
    loadConversation,

    isSending: sendMutation.isPending,
    isLoadingConversation,
  };
}
