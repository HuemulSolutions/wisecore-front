'use client';

import * as React from 'react';

import {
  MessageSquareTextIcon,
  MessagesSquareIcon,
  PencilLineIcon,
} from 'lucide-react';
import { useEditorRef, usePluginOption } from 'platejs/react';
import { useTranslation } from 'react-i18next';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { commentPlugin } from '@/components/plate-editor/components/comment-kit';
import { discussionPlugin } from '@/components/plate-editor/components/discussion-kit';
import { cn } from '@/lib/utils';

export interface DiscussionMarginIndicatorProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean;
  commentCount: number;
  suggestionCount: number;
  /** Author of the most recent comment, shown as the pill's avatar. */
  lastAuthorId?: string;
  /** Discussion id to highlight in the document on hover (`commentPlugin.hoverId`). */
  highlightId?: string;
}

/**
 * Margin gutter indicator for a block with open discussions and/or
 * suggestions. Always visible when the block has open discussions — the
 * caller decides whether to render it (see BlockCommentContent's
 * `totalCount > 0` gate).
 */
export const DiscussionMarginIndicator = React.forwardRef<
  HTMLButtonElement,
  DiscussionMarginIndicatorProps
>(function DiscussionMarginIndicator(
  {
    isActive,
    commentCount,
    suggestionCount,
    lastAuthorId,
    highlightId,
    className,
    ...buttonProps
  },
  ref
) {
  const { t } = useTranslation('editor');
  const editor = useEditorRef();
  const userInfo = usePluginOption(discussionPlugin, 'user', lastAuthorId ?? '');

  const hasDiscussions = commentCount > 0;
  const hasSuggestions = suggestionCount > 0;
  const total = commentCount + suggestionCount;

  const onlyDiscussions = hasDiscussions && !hasSuggestions;
  const onlySuggestions = hasSuggestions && !hasDiscussions;

  let visual: React.ReactNode = null;
  if (onlyDiscussions) {
    if (isActive) {
      visual = userInfo ? (
        <Avatar className="size-[18px] shrink-0 ring-1 ring-white">
          <AvatarImage alt={userInfo.name} src={userInfo.avatarUrl} />
          <AvatarFallback className="text-[9px]">{userInfo.name?.[0]}</AvatarFallback>
        </Avatar>
      ) : (
        <MessageSquareTextIcon className="size-3.5 shrink-0" />
      );
    }
  } else if (onlySuggestions) {
    visual = <PencilLineIcon className="size-3.5 shrink-0" />;
  } else {
    visual = <MessagesSquareIcon className="size-3.5 shrink-0" />;
  }

  return (
    <button
      ref={ref}
      type="button"
      aria-label={t('discussion.openThread')}
      contentEditable={false}
      onMouseEnter={() =>
        editor.setOption(commentPlugin, 'hoverId', highlightId ?? null)
      }
      onMouseLeave={() => editor.setOption(commentPlugin, 'hoverId', null)}
      className={cn(
        'mt-1 ml-1 flex h-[26px] items-center gap-1 rounded-full px-1.5 text-xs transition-colors',
        isActive
          ? 'bg-blue-600 text-white shadow-comment-pill'
          : 'border border-[#dbe3ec] bg-white text-slate-400',
        className
      )}
      {...buttonProps}
    >
      {visual}
      <span className="font-semibold">{total}</span>
    </button>
  );
});
