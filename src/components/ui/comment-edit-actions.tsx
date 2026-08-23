'use client';

import { CheckIcon, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import { CommentVisibilityToggle } from './comment-visibility-toggle';

export interface CommentEditActionsProps {
  isPublic: boolean;
  onToggleVisibility: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export function CommentEditActions({
  isPublic,
  onToggleVisibility,
  onCancel,
  onSave,
}: CommentEditActionsProps) {
  const { t } = useTranslation('editor');

  return (
    <div className="ml-auto flex shrink-0 gap-1">
      <CommentVisibilityToggle
        isPublic={isPublic}
        onToggle={onToggleVisibility}
        className="size-[28px]"
      />

      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-[28px]"
        aria-label={t('discussion.cancelEdit')}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          onCancel();
        }}
      >
        <div className="flex size-5 shrink-0 items-center justify-center rounded-[50%] bg-primary/40">
          <XIcon className="size-3 stroke-[3px] text-background" />
        </div>
      </Button>

      <Button
        size="icon"
        variant="ghost"
        aria-label={t('discussion.save')}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          onSave();
        }}
      >
        <div className="flex size-5 shrink-0 items-center justify-center rounded-[50%] bg-brand">
          <CheckIcon className="size-3 stroke-[3px] text-background" />
        </div>
      </Button>
    </div>
  );
}
