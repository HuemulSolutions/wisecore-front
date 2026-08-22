'use client';

import * as React from 'react';

import { KEYS, NodeApi, type Value } from 'platejs';
import {
  Check,
  ChevronDown,
  MessageSquareText,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HighlightedText } from '@/components/ui/highlighted-text';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HuemulAccessDenied } from '@/huemul/components/huemul-access-denied';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { HuemulSegmentedControl } from '@/huemul/components/huemul-segmented-control';
import { HuemulSheet } from '@/huemul/components/huemul-sheet';
import { useDebounce } from '@/hooks/use-debounce';
import { useDiscussions } from '@/hooks/useDiscussions';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { formatCommentDate } from '@/lib/comment-utils';
import { cn, normalizeForSearch } from '@/lib/utils';
import type { TComment } from '@/components/ui/comment';
import type {
  TDiscussion,
  TDiscussionUser,
} from '@/components/plate-editor/components/discussion-kit';
import type { ContentSection } from '@/types/assets';

export interface AssetsDiscussionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  sections: ContentSection[];
  onFocusDiscussion: (
    discussionId: string,
    sectionExecutionId: string | null | undefined
  ) => void;
}

interface DiscussionRow {
  discussion: TDiscussion;
  sectionName: string;
  isResolved: boolean;
  createdAt: Date;
  snippet: string;
  firstComment: TComment | undefined;
  firstCommentText: string;
  replyCount: number;
  hasPrivate: boolean;
  authorIds: string[];
  searchBlob: string;
}

function commentPlainText(contentRich: Value): string {
  try {
    return NodeApi.string({ children: contentRich, type: KEYS.p });
  } catch {
    return '';
  }
}

/** Sheet listing every discussion thread in the document, with search,
 * open/resolved and author filters, and click-to-navigate. Consumes the
 * same `useDiscussions` as the editor — no new endpoints. */
export function AssetsDiscussionsSheet({
  open,
  onOpenChange,
  documentId,
  sections,
  onFocusDiscussion,
}: AssetsDiscussionsSheetProps) {
  const { t } = useTranslation(['assets', 'common']);
  const { canList } = useUserPermissions();
  const canListDiscussions = canList('discussion');

  const { discussions, usersMap, isLoading, isFetching, refetch } = useDiscussions(
    canListDiscussions ? documentId : undefined
  );

  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [status, setStatus] = React.useState<'open' | 'resolved'>('open');
  const [selectedAuthors, setSelectedAuthors] = React.useState<Set<string>>(new Set());
  const [authorPopoverOpen, setAuthorPopoverOpen] = React.useState(false);
  const [resolvedGroupOpen, setResolvedGroupOpen] = React.useState(false);

  const sectionNameByExecutionId = React.useMemo(() => {
    const map = new Map<string, string>();
    sections.forEach((section) => {
      map.set(section.id, section.section_name || t('content.discussions.unknownSection'));
    });
    return map;
  }, [sections, t]);

  const rows = React.useMemo<DiscussionRow[]>(() => {
    return discussions
      .map((discussion) => {
        const sortedComments = [...discussion.comments].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
        const firstComment = sortedComments[0];
        const firstCommentText = firstComment ? commentPlainText(firstComment.contentRich) : '';
        const snippet = discussion.documentContent ?? '';
        const sectionName = discussion.sectionExecutionId
          ? sectionNameByExecutionId.get(discussion.sectionExecutionId) ??
            t('content.discussions.unknownSection')
          : t('content.discussions.unknownSection');
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
          isResolved: discussion.isResolved,
          createdAt: discussion.createdAt,
          snippet,
          firstComment,
          firstCommentText,
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

  const authorOptions = React.useMemo(() => {
    const ids = new Set<string>();
    rows.forEach((row) => row.authorIds.forEach((id) => ids.add(id)));
    return Array.from(ids)
      .map((id) => usersMap[id])
      .filter((u): u is TDiscussionUser => !!u)
      .sort((a, b) => a.name.localeCompare(b.name));
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

  const renderItem = (row: DiscussionRow, muted = false) => {
    const borderColor = row.isResolved
      ? 'border-l-slate-300'
      : row.hasPrivate
        ? 'border-l-amber-700'
        : 'border-l-blue-600';
    const authorInfo = row.firstComment ? usersMap[row.firstComment.userId] : undefined;

    return (
      <button
        key={row.discussion.id}
        type="button"
        onClick={() => onFocusDiscussion(row.discussion.id, row.discussion.sectionExecutionId)}
        className={cn(
          'w-full rounded-[10px] border border-l-[3px] border-[#e2e8f0] bg-white p-3 text-left transition-opacity hover:border-[#c9d4e3]',
          borderColor,
          muted && 'opacity-60'
        )}
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-[11.5px] text-slate-400">{row.sectionName}</span>
          {row.hasPrivate && (
            <Badge
              variant="outline"
              className="shrink-0 border-[#fadfb8] bg-[#fef3e2] px-1.5 py-0 font-semibold text-[10px] text-amber-700"
            >
              {t('content.discussions.privateBadge')}
            </Badge>
          )}
        </div>

        {row.snippet && (
          <p
            className={cn(
              'mb-1.5 truncate text-[12.5px] text-slate-500 italic',
              muted && 'line-through'
            )}
          >
            «<HighlightedText text={row.snippet} term={debouncedSearch} />»
          </p>
        )}

        {row.firstComment && (
          <div className="flex gap-2">
            <Avatar className="size-[22px] shrink-0">
              <AvatarImage alt={authorInfo?.name} src={authorInfo?.avatarUrl} />
              <AvatarFallback className="text-[10px]">{authorInfo?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[13px] text-slate-900">
                  {authorInfo?.name}
                </span>
                <span className="text-[11px] text-slate-400">
                  {formatCommentDate(row.firstComment.createdAt)}
                </span>
              </div>
              <p className="line-clamp-2 text-[12.5px] text-slate-700 leading-[1.45]">
                <HighlightedText text={row.firstCommentText} term={debouncedSearch} />
              </p>
            </div>
          </div>
        )}

        {row.replyCount > 0 && (
          <p className="mt-1.5 pl-[30px] font-medium text-[11.5px] text-blue-600">
            {t('content.discussions.replies', { count: row.replyCount })}
          </p>
        )}
      </button>
    );
  };

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('content.discussions.title')}
      description={t('content.discussions.description')}
      icon={MessageSquareText}
      showFooter={false}
      maxWidth="sm:max-w-[372px]"
      className="shadow-[-30px_0_60px_-20px_rgba(15,23,42,0.4)] sm:w-[372px]"
      headerExtra={
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-semibold">
            {rows.length}
          </Badge>
          <HuemulButton
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            icon={RefreshCw}
            tooltip={t('common:refresh')}
            loading={isFetching}
            onClick={() => refetch()}
          />
        </div>
      }
    >
      {!canListDiscussions ? (
        <HuemulAccessDenied variant="inline" />
      ) : (
        <div className="-mx-6 flex h-full flex-col">
          <div className="space-y-2.5 border-gray-100 border-b px-6 pb-3">
            <div className="relative">
              <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 size-3.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('content.discussions.searchPlaceholder')}
                className="h-8 w-full rounded-md border border-input bg-transparent pr-7 pl-8 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
              {search && (
                <button
                  type="button"
                  aria-label={t('content.discussions.clearSearch')}
                  onClick={() => setSearch('')}
                  className="-translate-y-1/2 absolute top-1/2 right-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <HuemulSegmentedControl
                value={status}
                onChange={setStatus}
                className="flex-1"
                options={[
                  {
                    value: 'open',
                    label: t('content.discussions.filterOpen', { count: visibleOpenRows.length }),
                  },
                  {
                    value: 'resolved',
                    label: t('content.discussions.filterResolved', {
                      count: visibleResolvedRows.length,
                    }),
                  },
                ]}
              />

              <Popover open={authorPopoverOpen} onOpenChange={setAuthorPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label={t('content.discussions.authorFilter')}
                    className={cn(
                      'flex h-[26px] shrink-0 items-center gap-1 rounded-md border border-[#e2e8f0] px-1.5 text-slate-500 hover:bg-gray-50',
                      selectedAuthors.size > 0 && 'border-blue-200 bg-blue-50 text-blue-700'
                    )}
                  >
                    {selectedAuthors.size > 0 ? (
                      <AvatarGroup>
                        {authorOptions
                          .filter((u) => selectedAuthors.has(u.id))
                          .slice(0, 3)
                          .map((u) => (
                            <Avatar key={u.id} className="size-[18px]">
                              <AvatarImage alt={u.name} src={u.avatarUrl} />
                              <AvatarFallback className="text-[8px]">{u.name?.[0]}</AvatarFallback>
                            </Avatar>
                          ))}
                      </AvatarGroup>
                    ) : (
                      <Users className="size-3.5" />
                    )}
                    <ChevronDown className="size-3 shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-2">
                  <p className="mb-1.5 px-1 font-semibold text-[11px] text-slate-400 uppercase tracking-wide">
                    {t('content.discussions.authorFilter')}
                  </p>
                  {authorOptions.length === 0 ? (
                    <p className="px-1 py-2 text-[12.5px] text-slate-400">
                      {t('content.discussions.authorFilterAll')}
                    </p>
                  ) : (
                    <div className="max-h-64 space-y-0.5 overflow-y-auto">
                      {authorOptions.map((u) => (
                        <label
                          key={u.id}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 hover:bg-gray-50"
                        >
                          <Checkbox
                            checked={selectedAuthors.has(u.id)}
                            onCheckedChange={() => toggleAuthor(u.id)}
                          />
                          <Avatar className="size-5">
                            <AvatarImage alt={u.name} src={u.avatarUrl} />
                            <AvatarFallback className="text-[10px]">{u.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 truncate text-[12.5px] text-slate-700">
                            {u.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#f7f9fb] px-6 py-3">
            {isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-24 w-full animate-pulse rounded-[10px] bg-white" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <MessageSquareText className="size-8 text-slate-300" />
                <p className="font-medium text-[13px] text-slate-500">
                  {t('content.discussions.empty')}
                </p>
                <p className="max-w-[220px] text-[12px] text-slate-400">
                  {t('content.discussions.emptyHint')}
                </p>
              </div>
            ) : searchedRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <p className="text-[13px] text-slate-500">{t('content.discussions.noResults')}</p>
                <HuemulButton variant="outline" size="sm" onClick={clearFilters}>
                  {t('content.discussions.clearFilters')}
                </HuemulButton>
              </div>
            ) : (
              <div className="space-y-2">
                {status === 'open' ? (
                  <>
                    {visibleOpenRows.map((row) => renderItem(row))}

                    {visibleResolvedRows.length > 0 && (
                      <Collapsible open={resolvedGroupOpen} onOpenChange={setResolvedGroupOpen}>
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#cbd5e1] border-dashed py-2 font-medium text-[12px] text-slate-500 hover:bg-white"
                          >
                            <Check className="size-3.5 text-green-600" />
                            {t('content.discussions.resolvedGroup', {
                              count: visibleResolvedRows.length,
                            })}
                            {' — '}
                            {resolvedGroupOpen
                              ? t('content.discussions.hideResolved')
                              : t('content.discussions.showResolved')}
                            <ChevronDown
                              className={cn(
                                'size-3.5 transition-transform',
                                resolvedGroupOpen && 'rotate-180'
                              )}
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-2">
                          {visibleResolvedRows.map((row) => renderItem(row, true))}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </>
                ) : (
                  visibleResolvedRows.map((row) => renderItem(row))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </HuemulSheet>
  );
}
