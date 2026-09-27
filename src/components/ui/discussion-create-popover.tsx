'use client';

import * as React from 'react';

import { type Value, KEYS, NodeApi } from 'platejs';
import { Plate, useEditorRef } from 'platejs/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { cancelDraftComment } from './comment-draft-actions';
import { CommentVisibilityToggle } from './comment-visibility-toggle';
import { Editor, EditorContainer } from './editor';
import { useCommentEditor } from './useCommentEditor';
import { useCommentSubmit } from './useCommentSubmit';
import { useDraftSnippet } from './useDraftSnippet';

export interface DiscussionCreatePopoverProps {
  className?: string;
}

/**
 * The "Comentando «snippet»" popover shown when starting a new discussion
 * from a text selection (draft comment mark). Distinct from
 * `CommentCreateForm` (the reply box inside an existing thread): this one
 * has a labeled Cancelar/Comentar footer instead of an icon-only send
 * button, per the design spec.
 */
export function DiscussionCreatePopover({ className }: DiscussionCreatePopoverProps) {
  const { t } = useTranslation('editor');
  const editor = useEditorRef();
  const snippet = useDraftSnippet();

  const [commentValue, setCommentValue] = React.useState<Value | undefined>();
  const [isPublic, setIsPublic] = React.useState(true);
  const commentContent = React.useMemo(
    () =>
      commentValue
        ? NodeApi.string({ children: commentValue, type: KEYS.p })
        : '',
    [commentValue]
  );
  const commentEditor = useCommentEditor();

  React.useEffect(() => {
    commentEditor.tf.focus();
  }, [commentEditor]);

  const { addComment } = useCommentSubmit({
    commentValue,
    isPublic,
    onSubmitted: () => {
      commentEditor.tf.reset();
      setIsPublic(true);
    },
  });

  const isEmpty = commentContent.trim().length === 0;

  return (
    <div className={cn('flex', className)}>
      <div className="w-[3px] shrink-0 bg-blue-600" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 border-b border-[#e8edf3] bg-[#f6f8fb] px-3 py-2">
          <span className="shrink-0 text-[11.5px] text-slate-400">
            {t('discussion.commentingOn')}
          </span>
          {snippet ? (
            <span className="min-w-0 truncate rounded-md bg-[#e2ecfe] px-1.5 py-0.5 text-[12px] text-slate-800">
              «{snippet}»
            </span>
          ) : (
            <span className="truncate text-[12px] text-slate-800">
              {t('discussion.newComment')}
            </span>
          )}
        </div>

        <div className="p-3">
          <Plate onChange={({ value }) => setCommentValue(value)} editor={commentEditor}>
            <EditorContainer variant="comment">
              <Editor
                variant="comment"
                className="min-h-[52px] grow"
                placeholder={t('discussion.commentPlaceholder')}
                autoComplete="off"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void addComment();
                  }
                }}
              />
            </EditorContainer>
          </Plate>

          <div className="mt-2 flex items-center justify-between">
            <CommentVisibilityToggle
              isPublic={isPublic}
              onToggle={() => setIsPublic((prev) => !prev)}
              showLabel
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => cancelDraftComment(editor)}
              >
                {t('discussion.cancel')}
              </Button>

              <Button
                type="button"
                size="sm"
                className="h-7 bg-blue-600 px-3 text-white text-xs hover:bg-blue-500"
                disabled={isEmpty}
                onClick={() => void addComment()}
              >
                {t('discussion.submit')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
