'use client';

import { FloatingToolbar } from '@/components/ui/floating-toolbar';
import { CommentToolbarButton } from '@/components/ui/comment-toolbar-button';
import { CreateSectionToolbarButton } from '@/components/ui/create-section-toolbar-button';
import { ToolbarSeparator } from '@/components/ui/toolbar';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface FloatingToolbarButtonsProps {
  onCreateSectionFromSelection?: (selectedMarkdown: string) => void;
  enableComments?: boolean;
  enableCreateSection?: boolean;
}

export function FloatingToolbarButtons({ onCreateSectionFromSelection, enableComments = true, enableCreateSection = true }: FloatingToolbarButtonsProps) {
  const { canCreate } = useUserPermissions();
  const canCreateDiscussion = canCreate('discussion');
  const showComments = enableComments && canCreateDiscussion;
  const showCreateSection = enableCreateSection && !!onCreateSectionFromSelection;

  return (
    <FloatingToolbar>
      {showComments && <CommentToolbarButton />}
      {showCreateSection && (
        <>
          {showComments && <ToolbarSeparator />}
          <CreateSectionToolbarButton onCreateSection={onCreateSectionFromSelection!} />
        </>
      )}
    </FloatingToolbar>
  );
}
