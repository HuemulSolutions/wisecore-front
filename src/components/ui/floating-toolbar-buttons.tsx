'use client';

import { FloatingToolbar } from '@/components/ui/floating-toolbar';
import { CommentToolbarButton } from '@/components/ui/comment-toolbar-button';

export function FloatingToolbarButtons() {
  return (
    <FloatingToolbar>
      <CommentToolbarButton />
    </FloatingToolbar>
  );
}
