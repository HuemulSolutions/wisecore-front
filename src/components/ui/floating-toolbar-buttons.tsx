'use client';

import { FloatingToolbar } from '@/components/ui/floating-toolbar';
import { CommentToolbarButton } from '@/components/ui/comment-toolbar-button';
import { CreateSectionToolbarButton } from '@/components/ui/create-section-toolbar-button';
import { ToolbarSeparator } from '@/components/ui/toolbar';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface FloatingToolbarButtonsProps {
  onCreateSectionFromSelection?: (selectedMarkdown: string) => void;
}

export function FloatingToolbarButtons({ onCreateSectionFromSelection }: FloatingToolbarButtonsProps) {
  const { canCreate } = useUserPermissions();
  const canCreateDiscussion = canCreate('discussion');

  return (
    <FloatingToolbar>
      {canCreateDiscussion && <CommentToolbarButton />}
      {onCreateSectionFromSelection && (
        <>
          {canCreateDiscussion && <ToolbarSeparator />}
          <CreateSectionToolbarButton onCreateSection={onCreateSectionFromSelection} />
        </>
      )}
    </FloatingToolbar>
  );
}
