'use client';

import * as React from 'react';

import { type Value, KEYS, NodeApi } from 'platejs';
import { ArrowUpIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Plate, usePluginOption } from 'platejs/react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { discussionPlugin } from '@/components/plate-editor/components/discussion-kit';

import { CommentVisibilityToggle } from './comment-visibility-toggle';
import { Editor, EditorContainer } from './editor';
import { useCommentEditor } from './useCommentEditor';
import { useCommentSubmit } from './useCommentSubmit';

export interface CommentCreateFormProps {
  autoFocus?: boolean;
  className?: string;
  discussionId?: string;
  focusOnMount?: boolean;
  /** Overrides the default "Responder…" placeholder. */
  placeholder?: string;
}

export function CommentCreateForm({
  autoFocus = false,
  className,
  discussionId,
  focusOnMount = false,
  placeholder,
}: CommentCreateFormProps) {
  const { t } = useTranslation('editor');

  const userInfo = usePluginOption(discussionPlugin, 'currentUser');
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
    if (commentEditor && focusOnMount) {
      commentEditor.tf.focus();
    }
  }, [commentEditor, focusOnMount]);

  const { addComment } = useCommentSubmit({
    discussionId,
    commentValue,
    isPublic,
    onSubmitted: () => {
      commentEditor.tf.reset();
      setIsPublic(true);
    },
  });

  return (
    <div className={cn('flex w-full', className)}>
      <div className="mt-2 mr-1 shrink-0">
        <Avatar className="size-5">
          <AvatarImage alt={userInfo?.name} src={userInfo?.avatarUrl} />
          <AvatarFallback>{userInfo?.name?.[0]}</AvatarFallback>
        </Avatar>
      </div>

      <div className="relative flex grow gap-2">
        <Plate
          onChange={({ value }) => {
            setCommentValue(value);
          }}
          editor={commentEditor}
        >
          <EditorContainer variant="comment">
            <Editor
              variant="comment"
              className="min-h-[25px] grow pt-0.5 pr-14"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void addComment();
                }
              }}
              placeholder={placeholder ?? t('discussion.replyPlaceholder')}
              autoComplete="off"
              autoFocus={autoFocus}
            />

            <CommentVisibilityToggle
              isPublic={isPublic}
              onToggle={() => setIsPublic((prev) => !prev)}
              className="absolute right-7 bottom-0.5"
            />

            <Button
              size="icon"
              variant="ghost"
              aria-label={t('discussion.send')}
              className="absolute right-0.5 bottom-0.5 ml-auto size-6 shrink-0"
              disabled={commentContent.trim().length === 0}
              onClick={(e) => {
                e.stopPropagation();
                void addComment();
              }}
            >
              <div className="flex size-6 items-center justify-center rounded-full">
                <ArrowUpIcon />
              </div>
            </Button>
          </EditorContainer>
        </Plate>
      </div>
    </div>
  );
}
