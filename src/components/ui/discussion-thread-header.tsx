'use client';

import * as React from 'react';

import { CheckIcon } from 'lucide-react';
import { usePluginOption } from 'platejs/react';
import { useTranslation } from 'react-i18next';

import { type TDiscussion, discussionPlugin } from '@/components/plate-editor/components/discussion-kit';
import { useUserPermissions } from '@/hooks/useUserPermissions';

import { CommentMoreDropdown } from './comment-more-dropdown';
import { useResolveDiscussion } from './useResolveDiscussion';

export interface DiscussionThreadHeaderProps {
  discussion: TDiscussion;
  snippet?: string;
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * Thread header band: accent rail, commented-text snippet, and the actions
 * that used to live inside the first comment row (✓ Resolver, ⋯). Visible
 * on hover/focus of the whole card (`group/thread`, set by
 * DiscussionThreadCard), not on hover of this header alone.
 */
export function DiscussionThreadHeader({
  discussion,
  snippet,
  setEditingId,
}: DiscussionThreadHeaderProps) {
  const { t } = useTranslation('editor');
  const currentUserId = usePluginOption(discussionPlugin, 'currentUserId');
  const { canUpdate } = useUserPermissions();
  const resolveDiscussion = useResolveDiscussion();

  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const openerComment = discussion.comments[0];
  const openerId = discussion.userId || openerComment?.userId;
  const canResolve = !!currentUserId && (currentUserId === openerId || canUpdate('discussion'));
  const canEditOpener = !!openerComment && currentUserId === openerComment.userId;

  return (
    <div className="flex">
      <div className="w-[3px] shrink-0 bg-blue-600" />

      <div className="flex min-w-0 flex-1 items-center gap-2 border-b border-[#e8edf3] bg-[#f6f8fb] px-3 py-2">
        {snippet && (
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-slate-500 italic">
            «{snippet}»
          </span>
        )}

        {(canResolve || canEditOpener) && (
          <div
            className={
              'ml-auto flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity ' +
              'group-hover/thread:opacity-100 group-focus-within/thread:opacity-100 ' +
              (dropdownOpen ? 'opacity-100' : '')
            }
          >
            {canResolve && (
              <button
                type="button"
                aria-label={t('discussion.resolve')}
                title={t('discussion.resolveShort')}
                className="flex size-6 items-center justify-center rounded-md text-green-600 hover:bg-green-50"
                onClick={() => resolveDiscussion(discussion.id)}
              >
                <CheckIcon className="size-4" />
              </button>
            )}

            {canEditOpener && openerComment && (
              <CommentMoreDropdown
                comment={openerComment}
                dropdownOpen={dropdownOpen}
                setDropdownOpen={setDropdownOpen}
                setEditingId={setEditingId}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
