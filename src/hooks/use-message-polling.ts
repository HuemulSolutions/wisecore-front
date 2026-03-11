import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useEffect, useCallback } from "react";
import { getMessage } from "@/services/chatbot";
import type { ChatMessage, MessageStatus } from "@/types/chatbot";

// ========================================
// Query keys
// ========================================

export const chatMessageQueryKeys = {
  all: ["chat-message"] as const,
  detail: (conversationId: string, messageId: string) =>
    [...chatMessageQueryKeys.all, conversationId, messageId] as const,
};

// ========================================
// Backoff configuration
// ========================================

/** 1s for the first 10 attempts */
const FAST_INTERVAL = 1_000;
const FAST_THRESHOLD = 10;

/** 2s for attempts 11-30 */
const MEDIUM_INTERVAL = 2_000;
const MEDIUM_THRESHOLD = 30;

/** 5s for attempts 31+ */
const SLOW_INTERVAL = 5_000;

/** Hard timeout: stop polling after 2 minutes */
const POLLING_TIMEOUT = 2 * 60 * 1_000;

/** Statuses that indicate polling should stop */
const TERMINAL_STATUSES: MessageStatus[] = ["completed", "error"];

function getIntervalForAttempt(attempt: number): number {
  if (attempt < FAST_THRESHOLD) return FAST_INTERVAL;
  if (attempt < MEDIUM_THRESHOLD) return MEDIUM_INTERVAL;
  return SLOW_INTERVAL;
}

// ========================================
// Hook
// ========================================

interface UseMessagePollingProps {
  conversationId: string | null;
  assistantMessageId: string | null;
  /** Called when the message reaches a terminal status */
  onComplete?: (message: ChatMessage) => void;
  /** Called when the message status is 'error' */
  onError?: (message: ChatMessage) => void;
}

interface UseMessagePollingReturn {
  /** The latest assistant message data (null until first successful fetch) */
  message: ChatMessage | null;
  /** Current message status */
  status: MessageStatus | null;
  /** Whether polling is currently active */
  isPolling: boolean;
  /** Any fetch error from the query */
  error: Error | null;
  /** Manually stop polling */
  stopPolling: () => void;
}

export function useMessagePolling({
  conversationId,
  assistantMessageId,
  onComplete,
  onError,
}: UseMessagePollingProps): UseMessagePollingReturn {
  const queryClient = useQueryClient();
  const attemptRef = useRef(0);
  const timedOutRef = useRef(false);
  const callbackFiredRef = useRef(false);

  // Query key for this specific message
  const queryKey =
    conversationId && assistantMessageId
      ? chatMessageQueryKeys.detail(conversationId, assistantMessageId)
      : chatMessageQueryKeys.all;

  const {
    data: message,
    error,
    isLoading,
  } = useQuery<ChatMessage>({
    queryKey,
    queryFn: () => getMessage(conversationId!, assistantMessageId!),
    enabled: !!conversationId && !!assistantMessageId && !timedOutRef.current,
    refetchInterval: (query) => {
      try {
        const data = query.state.data as ChatMessage | undefined;

        // Stop on terminal status
        if (data?.status && TERMINAL_STATUSES.includes(data.status)) {
          return false;
        }

        // Stop if timed out
        if (timedOutRef.current) {
          return false;
        }

        attemptRef.current += 1;
        return getIntervalForAttempt(attemptRef.current);
      } catch {
        return false;
      }
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 0, // Always fetch fresh data when polling
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attemptIndex) => Math.min(1_000 * 2 ** attemptIndex, 10_000),
  });

  // Derive polling state
  const isTerminal = !!message?.status && TERMINAL_STATUSES.includes(message.status);
  const isPolling =
    !!conversationId &&
    !!assistantMessageId &&
    !isTerminal &&
    !timedOutRef.current &&
    !error;

  // Fire callbacks on terminal status
  useEffect(() => {
    if (!message || callbackFiredRef.current) return;

    if (message.status === "completed") {
      callbackFiredRef.current = true;
      onComplete?.(message);
    } else if (message.status === "error") {
      callbackFiredRef.current = true;
      onError?.(message);
    }
  }, [message, onComplete, onError]);

  // Hard timeout: stop polling after POLLING_TIMEOUT ms
  useEffect(() => {
    if (!conversationId || !assistantMessageId) return;

    const timer = setTimeout(() => {
      timedOutRef.current = true;
      queryClient.cancelQueries({ queryKey });
    }, POLLING_TIMEOUT);

    return () => clearTimeout(timer);
  }, [conversationId, assistantMessageId, queryClient, queryKey]);

  // Reset refs when IDs change (new polling session)
  useEffect(() => {
    attemptRef.current = 0;
    timedOutRef.current = false;
    callbackFiredRef.current = false;
  }, [conversationId, assistantMessageId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      queryClient.cancelQueries({ queryKey });
    };
  }, [queryClient, queryKey]);

  const stopPolling = useCallback(() => {
    timedOutRef.current = true;
    queryClient.cancelQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    message: message ?? null,
    status: message?.status ?? (isLoading && isPolling ? "pending" : null),
    isPolling,
    error: error as Error | null,
    stopPolling,
  };
}
