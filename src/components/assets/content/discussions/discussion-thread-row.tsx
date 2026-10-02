import * as React from 'react';

import type { Value } from 'platejs';
import { Check, Lock, MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HighlightedText } from '@/components/ui/highlighted-text';
import { formatCommentDate, formatCommentDateAbsolute } from '@/lib/comment-utils';
import { cn } from '@/lib/utils';
import type { TDiscussionUser } from '@/components/plate-editor/components/discussion-kit';
import type { AssetsDiscussionRow } from '@/types/assets-discussions';

import { AssetsDiscussionComposer } from '../assets-discussion-composer';
import { DiscussionAuthorAvatar } from './discussion-author-avatar';
import { DiscussionScopeChip, type DiscussionScopeKind } from './discussion-scope-chip';

export interface DiscussionThreadRowProps {
  row: AssetsDiscussionRow;
  usersMap: Record<string, TDiscussionUser>;
  currentUserId: string;
  searchTerm: string;
  expanded: boolean;
  canReply: boolean;
  canManage: boolean;
  canRemove: boolean;
  isReplying: boolean;
  onToggleExpanded: () => void;
  onFocus: () => void;
  onResolve: () => void;
  onUnresolve: () => void;
  onDelete: () => void;
  onReply: (contentRich: Value, isPublic: boolean) => unknown;
}

const actionLinkClass =
  '-ml-1.5 rounded-md px-1.5 py-0.5 font-medium text-[12.5px] text-[#2563eb] transition-colors hover:cursor-pointer hover:bg-[#eff5ff]';

/** Un hilo de comentarios: meta, cita, primer comentario, respuestas y acciones. */
export function DiscussionThreadRow({
  row,
  usersMap,
  currentUserId,
  searchTerm,
  expanded,
  canReply,
  canManage,
  canRemove,
  isReplying,
  onToggleExpanded,
  onFocus,
  onResolve,
  onUnresolve,
  onDelete,
  onReply,
}: DiscussionThreadRowProps) {
  const { t } = useTranslation(['assets', 'common', 'editor']);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const scopeKind: DiscussionScopeKind = row.isDocumentScope
    ? 'document'
    : row.isUnknownSection
      ? 'unknown'
      : 'section';
  const author = row.firstComment ? usersMap[row.firstComment.userId] : undefined;
  const showMenu = canManage || canRemove;

  return (
    <article className="border-[#f1f5f9] border-b py-3.5 last:border-b-0">
      <div className="mb-2 flex items-center gap-2">
        <DiscussionScopeChip kind={scopeKind} label={row.sectionName} />
        {row.hasPrivate && (
          <span className="inline-flex h-[22px] shrink-0 items-center gap-1 rounded-[6px] bg-[#f1f5f9] px-2 font-semibold text-[#475569] text-[11.5px]">
            <Lock className="size-3" />
            {t('assets:content.discussions.privateBadge')}
          </span>
        )}
        <span className="ml-auto shrink-0 text-[#94a3b8] text-[12px]">
          <span title={formatCommentDateAbsolute(row.createdAt)}>
            {formatCommentDate(row.createdAt)}
          </span>
        </span>
        {showMenu && (
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title={t('assets:content.discussions.actionsLabel')}
                aria-label={t('assets:content.discussions.actionsLabel')}
                className={cn(
                  '-mr-1 flex size-[26px] shrink-0 items-center justify-center rounded-md text-[#64748b] transition-colors hover:cursor-pointer hover:bg-[#f1f5f9]',
                  menuOpen && 'bg-[#f1f5f9]'
                )}
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canManage && !row.isResolved && (
                <DropdownMenuItem onClick={onResolve}>
                  <Check className="size-4" />
                  {t('assets:content.discussions.resolveAction')}
                </DropdownMenuItem>
              )}
              {canManage && row.isResolved && (
                <DropdownMenuItem onClick={onUnresolve}>
                  <RotateCcw className="size-4" />
                  {t('assets:content.discussions.unresolveAction')}
                </DropdownMenuItem>
              )}
              {canRemove && (
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <Trash2 className="size-4" />
                  {t('assets:content.discussions.deleteAction')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {row.snippet && (
        <blockquote
          title={row.snippet}
          className="mb-2.5 line-clamp-2 rounded-[6px] bg-[#f8fafc] px-3 py-1.5 text-[#475569] text-[12.5px] italic"
        >
          «<HighlightedText text={row.snippet} term={searchTerm} />»
        </blockquote>
      )}

      {row.firstComment && (
        <div className="flex gap-2.5">
          <DiscussionAuthorAvatar
            user={author}
            userId={row.firstComment.userId}
            isAi={row.isAi}
            size={26}
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#0f172a] text-[13px]">
              {author?.name}
              {row.firstComment.isEdited && (
                <span className="ml-1 font-normal text-[#94a3b8] text-[12px]">
                  {t('assets:content.discussions.editedMark')}
                </span>
              )}
            </p>
            <p className="whitespace-pre-wrap break-words text-[#334155] text-[13.5px] leading-[1.55]">
              <HighlightedText text={row.firstCommentText} term={searchTerm} />
            </p>
          </div>
        </div>
      )}

      {expanded && row.replies.length > 0 && (
        <div className="mt-3 ml-[13px] space-y-3 border-[#e2e8f0] border-l pl-4">
          {row.replies.map(({ comment, text }) => {
            const replyAuthor = usersMap[comment.userId];
            return (
              <div key={comment.id} className="flex gap-2">
                <DiscussionAuthorAvatar user={replyAuthor} userId={comment.userId} size={22} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-1.5">
                    <span className="font-semibold text-[#0f172a] text-[12.5px]">
                      {replyAuthor?.name}
                    </span>
                    <span
                      className="text-[#94a3b8] text-[11.5px]"
                      title={formatCommentDateAbsolute(comment.createdAt)}
                    >
                      {formatCommentDate(comment.createdAt)}
                    </span>
                    {!comment.isPublic && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-[#f1f5f9] px-1.5 font-semibold text-[#475569] text-[10.5px]">
                        <Lock className="size-2.5" />
                        {t('assets:content.discussions.privateBadge')}
                      </span>
                    )}
                    {comment.isEdited && (
                      <span className="text-[#94a3b8] text-[11.5px]">
                        {t('assets:content.discussions.editedMark')}
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap break-words text-[#334155] text-[13px] leading-[1.55]">
                    <HighlightedText text={text} term={searchTerm} />
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {expanded && canReply && (
        <AssetsDiscussionComposer
          className="mt-3"
          autoFocus
          currentUser={usersMap[currentUserId]}
          placeholder={t('editor:discussion.replyPlaceholder')}
          isSubmitting={isReplying}
          onSubmit={onReply}
        />
      )}

      <div className="mt-2 flex items-center gap-3 pl-9">
        {row.replyCount > 0 ? (
          <button type="button" onClick={onToggleExpanded} className={actionLinkClass}>
            {expanded
              ? t('assets:content.discussions.hideReplies')
              : t('assets:content.discussions.replies', { count: row.replyCount })}
          </button>
        ) : (
          canReply && (
            <button type="button" onClick={onToggleExpanded} className={actionLinkClass}>
              {expanded ? t('common:cancel') : t('assets:content.discussions.reply')}
            </button>
          )
        )}
        {row.replyCount > 0 && canReply && !expanded && (
          <button type="button" onClick={onToggleExpanded} className={actionLinkClass}>
            {t('assets:content.discussions.reply')}
          </button>
        )}
        {!row.isDocumentScope && (
          <button
            type="button"
            onClick={onFocus}
            className="ml-auto rounded-md px-1.5 py-0.5 font-medium text-[#475569] text-[12.5px] transition-colors hover:cursor-pointer hover:bg-[#f1f5f9]"
          >
            {t('assets:content.discussions.viewInDocument')}
          </button>
        )}
      </div>
    </article>
  );
}
