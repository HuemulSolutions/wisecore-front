import type { PlateEditor } from 'platejs/react';

import { getDraftCommentKey } from '@platejs/comment';

import { commentPlugin } from '@/components/plate-editor/components/comment-kit';

/**
 * Cancels the in-progress draft comment: removes the draft mark from the
 * document and clears the plugin's active/commenting state. Single path
 * shared by Esc, the "Cancelar" button and click-outside so `activeId`
 * never goes stale (see block-discussion.tsx onOpenChange).
 */
export function cancelDraftComment(editor: PlateEditor): void {
  editor.tf.unsetNodes(getDraftCommentKey(), {
    at: [],
    mode: 'lowest',
    match: (n: any) => n[getDraftCommentKey()],
  });
  editor.setOption(commentPlugin, 'activeId', null);
  editor.setOption(commentPlugin, 'commentingBlock', null);
  editor.tf.focus();
}
