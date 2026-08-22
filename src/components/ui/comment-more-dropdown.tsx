'use client';

import * as React from 'react';

import { MoreHorizontalIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEditorRef, usePluginOption } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { discussionPlugin } from '@/components/plate-editor/components/discussion-kit';

import type { TComment } from './comment-item';

export interface CommentMoreDropdownProps {
  comment: TComment;
  dropdownOpen: boolean;
  setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
  onCloseAutoFocus?: () => void;
}

export function CommentMoreDropdown(props: CommentMoreDropdownProps) {
  const {
    comment,
    dropdownOpen,
    setDropdownOpen,
    setEditingId,
    onCloseAutoFocus,
  } = props;

  const { t } = useTranslation('editor');
  const editor = useEditorRef();

  const selectedEditCommentRef = React.useRef<boolean>(false);

  const callbacks = usePluginOption(discussionPlugin, 'callbacks');

  const onDeleteComment = React.useCallback(() => {
    if (!comment.id) return alert(t('discussion.tooFast'));

    // Optimistic local update
    const updatedDiscussions = editor
      .getOption(discussionPlugin, 'discussions')
      .map((discussion) => {
        if (discussion.id !== comment.discussionId) {
          return discussion;
        }

        const commentIndex = discussion.comments.findIndex(
          (c) => c.id === comment.id
        );
        if (commentIndex === -1) {
          return discussion;
        }

        return {
          ...discussion,
          comments: [
            ...discussion.comments.slice(0, commentIndex),
            ...discussion.comments.slice(commentIndex + 1),
          ],
        };
      });

    editor.setOption(discussionPlugin, 'discussions', updatedDiscussions);
    // Persist via API
    callbacks?.onDeleteComment?.(comment.id, comment.discussionId);
  }, [comment.discussionId, comment.id, editor, callbacks, t]);

  const onEditComment = React.useCallback(() => {
    selectedEditCommentRef.current = true;

    if (!comment.id) return alert(t('discussion.tooFast'));

    setEditingId(comment.id);
  }, [comment.id, setEditingId, t]);

  return (
    <DropdownMenu
      open={dropdownOpen}
      onOpenChange={setDropdownOpen}
      modal={false}
    >
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          className={cn('h-6 p-1 text-muted-foreground')}
          aria-label={t('discussion.moreActions')}
        >
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-48"
        onCloseAutoFocus={(e) => {
          if (selectedEditCommentRef.current) {
            onCloseAutoFocus?.();
            selectedEditCommentRef.current = false;
          }

          return e.preventDefault();
        }}
      >
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onEditComment}>
            <PencilIcon className="size-4" />
            {t('discussion.editComment')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDeleteComment}>
            <TrashIcon className="size-4" />
            {t('discussion.deleteComment')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
