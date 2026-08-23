'use client';

import { GlobeIcon, LockIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface CommentVisibilityToggleProps {
  isPublic: boolean;
  onToggle: () => void;
  /** Shows the "Todos"/"Solo yo" text label next to the icon. */
  showLabel?: boolean;
  className?: string;
}

export function CommentVisibilityToggle({
  isPublic,
  onToggle,
  showLabel = false,
  className,
}: CommentVisibilityToggleProps) {
  const { t } = useTranslation('editor');

  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? 'sm' : 'icon'}
      className={cn(
        showLabel
          ? 'h-7 gap-1.5 rounded-md px-2 text-slate-500 text-xs'
          : 'size-6 shrink-0 text-muted-foreground',
        className
      )}
      aria-label={t('discussion.visibilityToggle')}
      title={isPublic ? t('discussion.public') : t('discussion.private')}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      {isPublic ? (
        <GlobeIcon className="size-4" />
      ) : (
        <LockIcon className="size-4" />
      )}
      {showLabel && (isPublic ? t('discussion.publicLabel') : t('discussion.privateLabel'))}
    </Button>
  );
}
