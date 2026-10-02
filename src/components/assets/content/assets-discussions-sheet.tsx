'use client';

import * as React from 'react';

import { KEYS, NodeApi, type Value } from 'platejs';
import { MessageSquareText, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { HuemulAccessDenied } from '@/huemul/components/huemul-access-denied';
import { HuemulAlertDialog } from '@/huemul/components/huemul-alert-dialog';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { HuemulSheet } from '@/huemul/components/huemul-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { HuemulLoadError } from '@/huemul/components/huemul-load-error';
import { useDebounce } from '@/hooks/use-debounce';
import { useDiscussions } from '@/hooks/useDiscussions';
import { useOwnCommentRights } from '@/hooks/useOwnCommentRights';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { cn, normalizeForSearch } from '@/lib/utils';
import type { TDiscussion } from '@/components/plate-editor/components/discussion-kit';
import type { AssetsDiscussionRow } from '@/types/assets-discussions';
import type { ContentSection } from '@/types/assets';

import {
  DiscussionFiltersBar,
  type DiscussionAuthorOption,
  type DiscussionStatusFilter,
} from './discussions/discussion-filters-bar';
import { DiscussionFooterComposer } from './discussions/discussion-footer-composer';
import { DiscussionThreadRow } from './discussions/discussion-thread-row';

export interface AssetsDiscussionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  executionId: string | null;
  sections: ContentSection[];
  onFocusDiscussion: (
    discussionId: string,
    sectionExecutionId: string | null | undefined
  ) => void;
}

function commentPlainText(contentRich: Value): string {
  try {
    return NodeApi.string({ children: contentRich, type: KEYS.p });
  } catch {
    return '';
  }
}

function DiscussionsSkeleton() {
  return (
    <div className="space-y-5 py-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2.5 border-[#f1f5f9] border-b pb-5 last:border-b-0">
          <div className="flex items-center gap-2">
            <Skeleton className="h-[22px] w-28 rounded-[6px]" />
            <Skeleton className="ml-auto h-3 w-12" />
          </div>
          <Skeleton className="h-9 w-full rounded-[6px]" />
          <div className="flex gap-2.5">
            <Skeleton className="size-[26px] shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Sheet listing every discussion thread in the document, with search,
 * open/resolved and author filters, and click-to-navigate. Consumes the
 * same `useDiscussions` as the editor — no new endpoints. */
export function AssetsDiscussionsSheet({
  open,
  onOpenChange,
  documentId,
  executionId,
  sections,
  onFocusDiscussion,
}: AssetsDiscussionsSheetProps) {
  const { t } = useTranslation(['assets', 'common', 'editor']);
  const { canList, canCreate, canUpdate, canDelete } = useUserPermissions();
  const canListDiscussions = canList('discussion');
  const canCreateDiscussions = canCreate('discussion');
  const canUpdateDiscussions = canUpdate('discussion');
  const canDeleteDiscussions = canDelete('discussion');

  const {
    discussionsForExecution: discussions,
    usersMap,
    currentUserId,
    isLoading,
    isFetching,
    isError,
    refetch,
    createExecutionDiscussion,
    isCreatingExecutionDiscussion,
    addComment,
    isAddingComment,
    resolveDiscussion,
    unresolveDiscussion,
    deleteDiscussion,
  } = useDiscussions(
    canListDiscussions ? documentId : undefined,
    undefined,
    executionId ?? undefined,
  );

  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [status, setStatus] = React.useState<DiscussionStatusFilter>('open');
  const [selectedAuthors, setSelectedAuthors] = React.useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const [discussionToDelete, setDiscussionToDelete] = React.useState<TDiscussion | null>(null);

  const { isOwnAndCanComment } = useOwnCommentRights();
  const isOwner = React.useCallback(
    (discussion: TDiscussion) => isOwnAndCanComment(currentUserId, discussion.userId),
    [currentUserId, isOwnAndCanComment]
  );

  const handleUnresolve = (discussionId: string) => {
    unresolveDiscussion(discussionId);
    setStatus('open');
  };
  const handleDeleteConfirm = async () => {
    if (!discussionToDelete) return;
    await deleteDiscussion(discussionToDelete.id);
    setDiscussionToDelete(null);
  };

  const sectionNameByExecutionId = React.useMemo(() => {
    const map = new Map<string, string>();
    sections.forEach((section) => {
      map.set(section.id, section.section_name || t('content.discussions.unknownSection'));
    });
    return map;
  }, [sections, t]);

  const rows = React.useMemo<AssetsDiscussionRow[]>(() => {
    return discussions
      .map((discussion) => {
        const sortedComments = [...discussion.comments].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
        const firstComment = sortedComments[0];
        const firstCommentText = firstComment ? commentPlainText(firstComment.contentRich) : '';
        const replies = sortedComments
          .slice(1)
          .map((comment) => ({ comment, text: commentPlainText(comment.contentRich) }));
        const snippet = discussion.documentContent ?? '';
        const isDocumentScope = !discussion.sectionExecutionId;
        const knownSectionName = discussion.sectionExecutionId
          ? sectionNameByExecutionId.get(discussion.sectionExecutionId)
          : undefined;
        const isUnknownSection = !isDocumentScope && knownSectionName === undefined;
        const sectionName = isDocumentScope
          ? t('content.discussions.documentScope')
          : (knownSectionName ?? t('content.discussions.unknownSectionChip'));
        const hasPrivate = discussion.comments.some((c) => c.isPublic === false);
        const authorIds = Array.from(
          new Set(discussion.comments.map((c) => c.userId).filter(Boolean))
        );
        const allText = [
          snippet,
          sectionName,
          ...discussion.comments.map((c) => commentPlainText(c.contentRich)),
        ].join(' ');

        return {
          discussion,
          sectionName,
          isDocumentScope,
          isUnknownSection,
          isAi: discussion.authorType === 'ai',
          isResolved: discussion.isResolved,
          createdAt: discussion.createdAt,
          snippet,
          firstComment,
          firstCommentText,
          replies,
          replyCount: Math.max(0, discussion.comments.length - 1),
          hasPrivate,
          authorIds,
          searchBlob: normalizeForSearch(allText),
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [discussions, sectionNameByExecutionId, t]);

  const searchTerm = normalizeForSearch(debouncedSearch.trim());

  const searchedRows = React.useMemo(() => {
    return rows.filter((row) => {
      if (searchTerm && !row.searchBlob.includes(searchTerm)) return false;
      if (selectedAuthors.size > 0 && !row.authorIds.some((id) => selectedAuthors.has(id)))
        return false;
      return true;
    });
  }, [rows, searchTerm, selectedAuthors]);

  const visibleOpenRows = React.useMemo(
    () => searchedRows.filter((r) => !r.isResolved),
    [searchedRows]
  );
  const visibleResolvedRows = React.useMemo(
    () => searchedRows.filter((r) => r.isResolved),
    [searchedRows]
  );
  const visibleRows = status === 'open' ? visibleOpenRows : visibleResolvedRows;

  const totalOpen = React.useMemo(() => rows.filter((r) => !r.isResolved).length, [rows]);
  const totalResolved = rows.length - totalOpen;

  const authorOptions = React.useMemo<DiscussionAuthorOption[]>(() => {
    const counts = new Map<string, number>();
    rows.forEach((row) =>
      row.authorIds.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1))
    );
    return Array.from(counts.entries())
      .flatMap(([id, threadCount]) => (usersMap[id] ? [{ user: usersMap[id], threadCount }] : []))
      .sort((a, b) => a.user.name.localeCompare(b.user.name));
  }, [rows, usersMap]);

  const toggleAuthor = (id: string) => {
    setSelectedAuthors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedAuthors(new Set());
  };

  const toggleExpanded = (discussionId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(discussionId)) next.delete(discussionId);
      else next.add(discussionId);
      return next;
    });
  };

  const header = (
    <div className="border-[#f1f5f9] border-b bg-white">
      <div className="flex items-start gap-3 pt-[18px] pr-14 pl-6">
        <div className="min-w-0 flex-1" aria-hidden="true">
          <p className="font-[650] text-[#0f172a] text-[16px] leading-tight">
            {t('content.discussions.title')}
          </p>
          {canListDiscussions && !isLoading && (
            <p className="mt-0.5 text-[#64748b] text-[12.5px]">
              {t('content.discussions.summaryOpen', { count: totalOpen })}
              {' · '}
              {t('content.discussions.summaryResolved', { count: totalResolved })}{' '}
              {t('content.discussions.summaryInVersion')}
            </p>
          )}
        </div>
        {canListDiscussions && (
          <HuemulButton
            variant="ghost"
            size="icon"
            icon={RefreshCw}
            iconClassName={cn('h-4 w-4', isFetching && 'animate-spin')}
            aria-label={t('common:refresh')}
            tooltip={t('common:refresh')}
            disabled={isLoading}
            className="h-[30px] w-[30px] shrink-0 p-0 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
            onClick={() => void refetch()}
          />
        )}
      </div>
      {canListDiscussions && (
        <DiscussionFiltersBar
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          openCount={visibleOpenRows.length}
          resolvedCount={visibleResolvedRows.length}
          authorOptions={authorOptions}
          selectedAuthors={selectedAuthors}
          onToggleAuthor={toggleAuthor}
        />
      )}
    </div>
  );

  return (
    <>
      <HuemulSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t('content.discussions.title')}
        size="xl"
        showFooter={false}
        headerContent={header}
        overlayClassName="bg-[rgba(15,23,42,0.22)]"
        className="shadow-[-20px_0_40px_-20px_rgba(15,23,42,0.35)]"
        bodyClassName="py-0"
        bodyLoading={canListDiscussions && isLoading}
        bodySkeleton={<DiscussionsSkeleton />}
        footerContent={
          canListDiscussions && canCreateDiscussions && executionId && !isLoading ? (
            <DiscussionFooterComposer
              isSubmitting={isCreatingExecutionDiscussion}
              onSubmit={(contentRich, isPublic) =>
                createExecutionDiscussion({ contentRich, isPublic })
              }
            />
          ) : undefined
        }
      >
        {!canListDiscussions ? (
          <HuemulAccessDenied variant="inline" />
        ) : isError && rows.length === 0 ? (
          <HuemulLoadError onRetry={() => void refetch()} isRetrying={isFetching} />
        ) : rows.length === 0 ? (
          <div className="mx-auto flex max-w-[300px] flex-col items-center justify-center gap-1.5 py-20 text-center">
            <MessageSquareText className="mb-1 size-8 text-[#cbd5e1]" />
            <p className="font-semibold text-[#0f172a] text-[14.5px]">
              {t('content.discussions.empty')}
            </p>
            <p className="text-[#64748b] text-[13px]">{t('content.discussions.emptyHint')}</p>
          </div>
        ) : searchedRows.length === 0 ? (
          <div className="mx-auto flex max-w-[300px] flex-col items-center justify-center gap-3 py-20 text-center">
            <p className="text-[#64748b] text-[13px]">{t('content.discussions.noResults')}</p>
            <HuemulButton variant="outline" size="sm" onClick={clearFilters}>
              {t('content.discussions.clearFilters')}
            </HuemulButton>
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="mx-auto flex max-w-[300px] flex-col items-center justify-center gap-1.5 py-20 text-center">
            <p className="font-semibold text-[#0f172a] text-[14.5px]">
              {status === 'open'
                ? t('content.discussions.emptyOpen')
                : t('content.discussions.emptyResolved')}
            </p>
          </div>
        ) : (
          <div>
            {visibleRows.map((row) => (
              <DiscussionThreadRow
                key={row.discussion.id}
                row={row}
                usersMap={usersMap}
                currentUserId={currentUserId}
                searchTerm={debouncedSearch}
                expanded={expandedIds.has(row.discussion.id)}
                canReply={canCreateDiscussions}
                canManage={canUpdateDiscussions || isOwner(row.discussion)}
                canRemove={canDeleteDiscussions || isOwner(row.discussion)}
                isReplying={isAddingComment}
                onToggleExpanded={() => toggleExpanded(row.discussion.id)}
                onFocus={() =>
                  onFocusDiscussion(row.discussion.id, row.discussion.sectionExecutionId)
                }
                onResolve={() => resolveDiscussion(row.discussion.id)}
                onUnresolve={() => handleUnresolve(row.discussion.id)}
                onDelete={() => setDiscussionToDelete(row.discussion)}
                onReply={(contentRich, isPublic) =>
                  addComment({ discussionId: row.discussion.id, contentRich, isPublic })
                }
              />
            ))}
          </div>
        )}
      </HuemulSheet>

      <HuemulAlertDialog
        open={!!discussionToDelete}
        onOpenChange={(next) => {
          if (!next) setDiscussionToDelete(null);
        }}
        title={t('content.discussions.deleteTitle')}
        description={t('content.discussions.deleteDescription', {
          count: discussionToDelete?.comments.length ?? 0,
        })}
        actionLabel={t('content.discussions.deleteAction')}
        className="rounded-[14px]"
        actionClassName="bg-[#dc2626] text-white hover:bg-[#b91c1c]"
        onAction={handleDeleteConfirm}
      />
    </>
  );
}
