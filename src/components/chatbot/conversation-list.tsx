import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { MessageCircle, Clock, Loader2, Pencil, Trash2, Check, X, MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listConversations, updateConversationTitle, archiveConversation } from '@/services/chatbot';
import { useOrganization } from '@/contexts/organization-context';
import { chatbotQueryKeys } from '@/hooks/use-chatbot';
import { formatRelativeTime } from '@/lib/format-relative-time';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HuemulAlertDialog } from '@/huemul/components/huemul-alert-dialog';
import { HuemulButton } from '@/huemul/components/huemul-button';
import type { Conversation } from '@/types/chatbot';

// ========================================
// Types
// ========================================

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  activeConversationId: string | null;
  /** Called after deleting the active conversation so the parent can reset the view. */
  onDeletedActiveConversation?: () => void;
}

// ========================================
// Empty state
// ========================================

function EmptyConversations() {
  const { t } = useTranslation('chatbot');
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-8">
      <Clock className="w-10 h-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium text-muted-foreground mb-1">
        {t('conversations.empty')}
      </p>
      <p className="text-xs text-muted-foreground/70">
        {t('conversations.emptyHint')}
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
  onRename,
  onDelete,
  isRenaming,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  isRenaming: boolean;
}) {
  const { t } = useTranslation('chatbot');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const title = conversation.title || t('conversations.defaultTitle');

  const startEditing = useCallback(() => {
    setEditValue(conversation.title || '');
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [conversation.title]);

  const confirmRename = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== conversation.title) {
      onRename(conversation.id, trimmed);
    }
    setIsEditing(false);
  }, [editValue, conversation.id, conversation.title, onRename]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  if (isEditing) {
    return (
      <div
        className={`w-full flex items-center gap-1.5 px-3 py-2 rounded-md border ${
          isActive ? 'border-primary/20 bg-primary/5' : 'border-input bg-background'
        }`}
      >
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirmRename();
            if (e.key === 'Escape') cancelEditing();
          }}
          className="flex-1 min-w-0 text-sm bg-transparent outline-none"
          placeholder={t('conversations.defaultTitle')}
        />
        <HuemulButton
          icon={Check}
          variant="ghost"
          size="icon"
          onClick={confirmRename}
          className="shrink-0 h-6 w-6 text-green-600 hover:bg-green-50 hover:cursor-pointer"
        />
        <HuemulButton
          icon={X}
          variant="ghost"
          size="icon"
          onClick={cancelEditing}
          className="shrink-0 h-6 w-6 text-muted-foreground hover:bg-muted hover:cursor-pointer"
        />
      </div>
    );
  }

  const isBusy = isRenaming;

  return (
    <div
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors ${
        isActive
          ? 'bg-accent border border-primary/20'
          : 'border border-transparent hover:bg-accent/50'
      } ${isBusy ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={isBusy}
        className="flex-1 flex items-center gap-3 min-w-0 hover:cursor-pointer"
      >
        {isBusy ? (
          <Loader2 className="w-4 h-4 flex-shrink-0 text-muted-foreground animate-spin" />
        ) : (
          <MessageCircle
            className={`w-4 h-4 flex-shrink-0 ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-sm truncate ${
                isActive ? 'font-medium text-primary' : 'font-medium text-foreground'
              }`}
            >
              {title}
            </span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatRelativeTime(conversation.updated_at)}
            </span>
          </div>
        </div>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={isBusy}
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:cursor-pointer transition-all focus-visible:opacity-100"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[140px]">
          <DropdownMenuItem
            onClick={startEditing}
            className="hover:cursor-pointer text-xs gap-2"
          >
            <Pencil className="w-3.5 h-3.5" />
            {t('conversations.rename')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(conversation.id)}
            className="hover:cursor-pointer text-xs gap-2 text-red-600 focus:text-red-600"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('conversations.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ========================================
// Conversation list
// ========================================

const PAGE_SIZE = 20;

export function ConversationList({
  onSelectConversation,
  activeConversationId,
  onDeletedActiveConversation,
}: ConversationListProps) {
  const { t } = useTranslation('chatbot');
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganization();

  // Accumulated conversations across all loaded pages
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Fetch current page
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...chatbotQueryKeys.conversations(selectedOrganizationId), 'list', page],
    queryFn: () => listConversations(page, PAGE_SIZE),
    refetchOnMount: 'always',
    enabled: !!selectedOrganizationId,
  });

  // ── Mutations ────────────────────────────────────────────────
  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => updateConversationTitle(id, title),
    onSuccess: (_data, { id, title }) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    },
  });

  const handleRename = useCallback((id: string, title: string) => {
    renameMutation.mutate({ id, title });
  }, [renameMutation]);

  useEffect(() => {
    setConversations([]);
    setPage(1);
    setHasNext(false);
  }, [selectedOrganizationId]);

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
        queryKey: chatbotQueryKeys.conversations(selectedOrganizationId),
      });
    };
  }, [queryClient, selectedOrganizationId]);

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
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
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
            onRename={handleRename}
            onDelete={setDeleteTarget}
            isRenaming={renameMutation.isPending && renameMutation.variables?.id === conversation.id}
          />
        ))}

        {/* Load more */}
        {hasNext && (
          <div className="flex justify-center pt-2 pb-1">
            <HuemulButton
              label={isFetching ? t('conversations.loading') : t('conversations.loadMore')}
              variant="ghost"
              size="sm"
              loading={isFetching}
              onClick={handleLoadMore}
              className="text-xs text-primary hover:text-primary/80 hover:cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <HuemulAlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={t('conversations.deleteTitle')}
        description={t('conversations.deleteDescription')}
        actionLabel={t('conversations.delete')}
        cancelLabel={t('conversations.cancel')}
        onAction={async () => {
          if (deleteTarget) {
            await archiveConversation(deleteTarget);
            setConversations((prev) => prev.filter((c) => c.id !== deleteTarget));
            if (deleteTarget === activeConversationId) {
              onDeletedActiveConversation?.();
            }
          }
        }}
      />
    </div>
  );
}
