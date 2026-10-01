import * as React from 'react';

import type { Value } from 'platejs';
import { useTranslation } from 'react-i18next';

import { CommentVisibilityToggle } from '@/components/ui/comment-visibility-toggle';
import { plainTextToCommentValue } from '@/lib/comment-utils';
import { cn } from '@/lib/utils';

export interface DiscussionFooterComposerProps {
  isSubmitting: boolean;
  onSubmit: (contentRich: Value, isPublic: boolean) => unknown;
}

/** Composer fijo al pie del sheet: crea un comentario general de la versión. */
export function DiscussionFooterComposer({ isSubmitting, onSubmit }: DiscussionFooterComposerProps) {
  const { t } = useTranslation('assets');
  const [text, setText] = React.useState('');
  const [isPublic, setIsPublic] = React.useState(true);

  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0 && !isSubmitting;

  const submit = async () => {
    if (!canSubmit) return;
    await onSubmit(plainTextToCommentValue(trimmed), isPublic);
    setText('');
    setIsPublic(true);
  };

  return (
    <div className="border-[#eef1f6] border-t bg-white px-6 py-3.5">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void submit();
          }
        }}
        rows={2}
        placeholder={t('content.discussions.newCommentPlaceholder')}
        aria-label={t('content.discussions.newCommentPlaceholder')}
        className="w-full resize-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-[13.5px] text-[#334155] leading-[1.55] outline-none placeholder:text-[#94a3b8] focus-visible:border-[#2563eb] focus-visible:ring-[3px] focus-visible:ring-[#dbeafe]"
      />
      <div className="mt-2.5 flex items-center gap-3">
        <CommentVisibilityToggle
          showLabel
          isPublic={isPublic}
          onToggle={() => setIsPublic((prev) => !prev)}
          className={cn(
            'h-7 shrink-0 gap-1.5 rounded-md border px-2.5 font-medium text-[12px] transition-colors',
            isPublic
              ? 'border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc]'
              : 'border-[#0f172a] bg-[#0f172a] text-white hover:bg-[#1e293b] hover:text-white'
          )}
        />
        <p className="min-w-0 flex-1 truncate text-[11.5px] text-[#94a3b8]">
          {t('content.discussions.composerHelp')}
        </p>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => void submit()}
          className={cn(
            'h-8 shrink-0 rounded-lg px-3.5 font-semibold text-[13px] text-white transition-colors',
            canSubmit
              ? 'bg-[#2563eb] hover:bg-[#1d4ed8] hover:cursor-pointer'
              : 'cursor-not-allowed bg-[#94a3b8]'
          )}
        >
          {t('content.discussions.submit')}
        </button>
      </div>
    </div>
  );
}
