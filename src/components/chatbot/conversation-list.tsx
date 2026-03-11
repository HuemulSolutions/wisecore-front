import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Clock, Loader2 } from 'lucide-react';
import { listConversations } from '@/services/chatbot';
import { chatbotQueryKeys } from '@/hooks/use-chatbot';
import { formatRelativeTime } from '@/lib/format-relative-time';
import type { Conversation } from '@/types/chatbot';

// ========================================
// Types
// ========================================

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  activeConversationId: string | null;
}

// ========================================
// Empty state
// ========================================

function EmptyConversations() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-8">
      <Clock className="w-10 h-10 text-gray-300 mb-3" />
      <p className="text-sm font-medium text-gray-500 mb-1">
        No conversations yet
      </p>
      <p className="text-xs text-gray-400">
        Start a new conversation to see it here
      </p>
    </div>
  );
}

// ========================================
// Conversation item
// ========================================

function ConversationItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const title = conversation.title || 'New conversation';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
        isActive
          ? 'bg-[#4464f7]/5 border border-[#4464f7]/20'
          : 'border border-transparent hover:bg-gray-50'
      }`}
    >
      <MessageCircle
        className={`w-4 h-4 flex-shrink-0 ${
          isActive ? 'text-[#4464f7]' : 'text-gray-400'
        }`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-sm truncate ${
              isActive ? 'font-medium text-[#4464f7]' : 'font-medium text-gray-700'
            }`}
          >
            {title}
          </span>
          <span className="text-xs text-gray-400 flex-shrink-0">
            {formatRelativeTime(conversation.updated_at)}
          </span>
        </div>
      </div>
    </button>
  );
}

// ========================================
// Conversation list
// ========================================

const PAGE_SIZE = 20;

export function ConversationList({
  onSelectConversation,
  activeConversationId,
}: ConversationListProps) {
  const queryClient = useQueryClient();

  // Accumulated conversations across all loaded pages
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  // Fetch current page
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...chatbotQueryKeys.conversations(), 'list', page],
    queryFn: () => listConversations(page, PAGE_SIZE),
    refetchOnMount: 'always',
  });

  // When data arrives, accumulate or replace conversations
  useEffect(() => {
    if (!data) return;

    setHasNext(data.hasNext);

    if (page === 1) {
      // First page: replace everything (handles refetch/refresh)
      setConversations(data.items);
    } else {
      // Subsequent pages: append new items (deduplicate by id)
      setConversations((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newItems = data.items.filter((c) => !existingIds.has(c.id));
        return [...prev, ...newItems];
      });
    }
  }, [data, page]);

  // Reset to page 1 when component mounts (fresh view each time)
  useEffect(() => {
    return () => {
      // On unmount, invalidate so next mount gets fresh data
      queryClient.invalidateQueries({
        queryKey: chatbotQueryKeys.conversations(),
      });
    };
  }, [queryClient]);

  const handleLoadMore = useCallback(() => {
    if (hasNext && !isFetching) {
      setPage((prev) => prev + 1);
    }
  }, [hasNext, isFetching]);

  const handleSelect = useCallback(
    (conversationId: string) => {
      onSelectConversation(conversationId);
    },
    [onSelectConversation]
  );

  // ── Loading state (initial only) ─────────────────────────────
  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#4464f7] animate-spin" />
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────
  if (!isLoading && conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyConversations />
      </div>
    );
  }

  // ── List ──────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeConversationId}
            onClick={() => handleSelect(conversation.id)}
          />
        ))}

        {/* Load more */}
        {hasNext && (
          <div className="flex justify-center pt-2 pb-1">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isFetching}
              className="text-xs text-[#4464f7] hover:text-[#3451e6] transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isFetching ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load more'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
