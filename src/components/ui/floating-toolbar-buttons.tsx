'use client';

import { FloatingToolbar } from '@/components/ui/floating-toolbar';
import { CommentToolbarButton } from '@/components/ui/comment-toolbar-button';
import { CreateSectionToolbarButton } from '@/components/ui/create-section-toolbar-button';
import { ToolbarSeparator } from '@/components/ui/toolbar';

interface FloatingToolbarButtonsProps {
  onCreateSectionFromSelection?: (selectedMarkdown: string) => void;
}

export function FloatingToolbarButtons({ onCreateSectionFromSelection }: FloatingToolbarButtonsProps) {
  return (
    <FloatingToolbar>
      <CommentToolbarButton />
      {onCreateSectionFromSelection && (
        <>
          <ToolbarSeparator />
          <CreateSectionToolbarButton onCreateSection={onCreateSectionFromSelection} />
        </>
      )}
    </FloatingToolbar>
  );
}
