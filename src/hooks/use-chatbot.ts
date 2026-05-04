import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  createConversation,
  getConversation,
  sendMessage as sendMessageService,
  updateConversationTitle,
} from "@/services/chatbot";
import { useOrganization } from "@/contexts/organization-context";
import { useMessagePolling } from "@/hooks/use-message-polling";
import type {
  ChatMessage,
  ConversationReference,
  SendMessageResponse,
  WorkingContextItem,
} from "@/types/chatbot";

// ========================================
// Query keys
// ========================================

export const chatbotQueryKeys = {
  all: ["chatbot"] as const,
  org: (organizationId: string | null | undefined) =>
    [...chatbotQueryKeys.all, organizationId ?? "no-org"] as const,
  conversations: (organizationId: string | null | undefined) =>
    [...chatbotQueryKeys.org(organizationId), "conversations"] as const,
  conversation: (organizationId: string | null | undefined, id: string) =>
    [...chatbotQueryKeys.org(organizationId), "conversation", id] as const,
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
  status: "completed" | "pending" = "completed",
  workingContextItems?: WorkingContextItem[],
): ChatMessage {
  const now = new Date().toISOString();
  return {
    id: `optimistic-${role}-${Date.now()}`,
    conversation_id: conversationId,
    role,
    content,
    metadata: null,
    status,
    llm: null,
    working_context_items: workingContextItems,
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

function getLatestPendingAssistantMessage(
  messages: ChatMessage[] | null | undefined
): ChatMessage | null {
  if (!messages || messages.length === 0) return null;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === "assistant" && message.status === "pending") {
      return message;
    }
  }

  return null;
}

/**
 * Merge stored working_context with current references and explicit items,
 * deduplicating by type+id.
 */
function buildWorkingContext(
  stored: ConversationReference[],
  current?: ConversationReference[],
  explicit?: ConversationReference[]
): ConversationReference[] {
  const all = [...stored, ...(current ?? []), ...(explicit ?? [])];
  const seen = new Set<string>();
  const result: ConversationReference[] = [];

  for (const ref of all) {
    const key = `${ref.type}:${ref.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ type: ref.type, id: ref.id });
    }
  }

  return result;
}

// ========================================
// Hook
// ========================================

interface UseChatbotProps {
  /**
   * References representing the user's current context (document/execution).
   * Merged with stored working_context and sent as working_context on each turn.
   */
  references?: ConversationReference[];
  /** Optional LLM selected for the next message to send. */
  selectedLlmId?: string;
  /** Explicit working context items added by the user (drag-drop, badge, etc.). */
  workingContextItems?: WorkingContextItem[];
}

interface UseChatbotReturn {
  /** Current conversation ID (null if no active conversation) */
  conversationId: string | null;
  /** Messages to render — includes optimistic entries */
  messages: ChatMessage[];
  /** Latest assistant message received from polling */
  assistantMessage: ChatMessage | null;
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
  selectedLlmId,
  workingContextItems,
}: UseChatbotProps = {}): UseChatbotReturn {
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganization();

  const mergeAssistantMessage = useCallback(
    (nextAssistantMessage: ChatMessage) => {
      setMessages((prev) => {
        let matchedById = false;

        const nextMessages = prev.map((msg) => {
          if (msg.id === nextAssistantMessage.id) {
            matchedById = true;
            return nextAssistantMessage;
          }

          return msg;
        });

        if (matchedById) {
          return nextMessages;
        }

        return nextMessages.map((msg) =>
          msg.id.startsWith("optimistic-assistant")
            ? {
                ...msg,
                id: nextAssistantMessage.id,
                content: nextAssistantMessage.content,
                metadata: nextAssistantMessage.metadata,
                status: nextAssistantMessage.status,
                llm: nextAssistantMessage.llm,
                created_at: nextAssistantMessage.created_at,
                updated_at: nextAssistantMessage.updated_at,
                created_by: nextAssistantMessage.created_by,
                updated_by: nextAssistantMessage.updated_by,
              }
            : msg
        );
      });
    },
    []
  );

  // ── Core state ──────────────────────────────────────────────
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingAssistantId, setPendingAssistantId] = useState<string | null>(
    null
  );
  const [workingContext, setWorkingContext] = useState<ConversationReference[]>(
    []
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
      mergeAssistantMessage(completedMessage);
      setPendingAssistantId(null);
    },
    [mergeAssistantMessage]
  );

  const handlePollingError = useCallback(
    (errorMessage: ChatMessage) => {
      mergeAssistantMessage(errorMessage);
      setPendingAssistantId(null);
    },
    [mergeAssistantMessage]
  );

  const { message: assistantMessage, isPolling } = useMessagePolling({
    conversationId,
    assistantMessageId: pendingAssistantId,
    onComplete: handlePollingComplete,
    onError: handlePollingError,
  });

  useEffect(() => {
    if (!assistantMessage) return;

    mergeAssistantMessage(assistantMessage);
  }, [assistantMessage, mergeAssistantMessage]);

  // ── Send message mutation ───────────────────────────────────
  const sendMutation = useMutation<
    SendMessageResponse,
    Error,
    {
      conversationId: string;
      content: string;
      workingContext?: ConversationReference[];
      llmId?: string;
    }
  >({
    mutationFn: ({ conversationId: convId, content, workingContext: wc, llmId }) =>
      sendMessageService(convId, content, wc, llmId),
    onSuccess: (data, variables) => {
      // Replace the optimistic user message ID with the real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id.startsWith("optimistic-user")
            ? { ...msg, id: data.message_id }
            : msg
        )
      );

      // Store the normalized working_context returned by the backend
      setWorkingContext(data.working_context ?? []);

      // Start polling for the assistant's response
      setPendingAssistantId(data.assistant_message_id);

      // Auto-title on first message
      if (isFirstMessageRef.current) {
        isFirstMessageRef.current = false;
        const title = generateAutoTitle(variables.content);
        updateConversationTitle(data.conversation_id, title).then(() => {
          queryClient.invalidateQueries({
            queryKey: chatbotQueryKeys.conversations(selectedOrganizationId),
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
          const conv = await createConversation();
          activeConversationId = conv.id;
          setConversationId(conv.id);

          // Invalidate conversations list so it picks up the new one
          queryClient.invalidateQueries({
            queryKey: chatbotQueryKeys.conversations(selectedOrganizationId),
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
        trimmed,
        "completed",
        workingContextItems && workingContextItems.length > 0 ? [...workingContextItems] : undefined,
      );
      const optimisticAssistant = buildOptimisticMessage(
        activeConversationId,
        "assistant",
        null,
        "pending"
      );
      setMessages((prev) => [...prev, optimisticUser, optimisticAssistant]);

      // Build working_context: merge stored context with current references and explicit items
      const mergedContext = buildWorkingContext(
        workingContext,
        references,
        workingContextItems,
      );

      // Fire the mutation — include working_context so backend has turn context
      sendMutation.mutate({
        conversationId: activeConversationId,
        content: trimmed,
        workingContext: mergedContext,
        llmId: selectedLlmId,
      });
    },
    [conversationId, references, queryClient, selectedLlmId, selectedOrganizationId, sendMutation, workingContext, workingContextItems]
  );

  const startNewConversation = useCallback(
    () => {
      // Reset all state — conversation will be created lazily on first message.
      // References are passed via the `references` prop and re-sent on every message.
      setConversationId(null);
      setMessages([]);
      setPendingAssistantId(null);
      setWorkingContext([]);
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
        const loadedMessages = detail.messages ?? [];
        const pendingAssistantMessage = getLatestPendingAssistantMessage(loadedMessages);

        setMessages(loadedMessages);
        setPendingAssistantId(pendingAssistantMessage?.id ?? null);
        setWorkingContext(detail.last_working_context ?? []);
        // If the conversation already has messages, it's not the first message
        isFirstMessageRef.current =
          loadedMessages.length === 0;
      } catch {
        // Global error handler shows toast
        setMessages([]);
        setPendingAssistantId(null);
      } finally {
        setIsLoadingConversation(false);
      }
    },
    []
  );

  return {
    conversationId,
    messages,
    assistantMessage,
    isTyping: isPolling,

    sendMessage,
    startNewConversation,
    loadConversation,

    isSending: sendMutation.isPending,
    isLoadingConversation,
  };
}
