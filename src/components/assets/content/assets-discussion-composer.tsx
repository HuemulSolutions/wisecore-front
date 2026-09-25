'use client';

import * as React from 'react';

import type { Value } from 'platejs';
import { ArrowUpIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CommentVisibilityToggle } from '@/components/ui/comment-visibility-toggle';
import { cn } from '@/lib/utils';
import type { TDiscussionUser } from '@/components/plate-editor/components/discussion-kit';

export interface AssetsDiscussionComposerProps {
  currentUser: TDiscussionUser | undefined;
  placeholder: string;
  isSubmitting: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  onSubmit: (contentRich: Value, isPublic: boolean) => unknown;
}

/** Lightweight comment composer for the discussions sheet — no Plate editor,
 * no discussion mark. Serializes to the same paragraph-node shape the
 * backend's `content_rich` expects. */
export function AssetsDiscussionComposer({
  currentUser,
  placeholder,
  isSubmitting,
  disabled = false,
  autoFocus = false,
  className,
  onSubmit,
}: AssetsDiscussionComposerProps) {
  const { t } = useTranslation('editor');
  const [text, setText] = React.useState('');
  const [isPublic, setIsPublic] = React.useState(true);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const submit = React.useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting || disabled) return;
    const contentRich: Value = [{ type: 'p', children: [{ text: trimmed }] }];
    await onSubmit(contentRich, isPublic);
    setText('');
    setIsPublic(true);
  }, [text, isPublic, isSubmitting, disabled, onSubmit]);

  return (
    <div className={cn('flex w-full', className)}>
      <div className="mt-2 mr-1 shrink-0">
        <Avatar className="size-5">
          <AvatarImage alt={currentUser?.name} src={currentUser?.avatarUrl} />
          <AvatarFallback>{currentUser?.name?.[0]}</AvatarFallback>
        </Avatar>
      </div>

      <div className="relative flex grow gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          rows={1}
          className="min-h-[25px] w-full grow resize-none rounded-md border border-input bg-transparent px-2 pt-1 pr-14 pb-1 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
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
          disabled={disabled || isSubmitting || text.trim().length === 0}
          onClick={(e) => {
            e.stopPropagation();
            void submit();
          }}
        >
          <div className="flex size-6 items-center justify-center rounded-full">
            <ArrowUpIcon />
          </div>
        </Button>
      </div>
    </div>
  );
}
