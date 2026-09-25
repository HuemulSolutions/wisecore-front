'use client';

import * as React from 'react';

import { useEditorRef, usePluginOption } from 'platejs/react';

import { commentPlugin } from '@/components/plate-editor/components/comment-kit';
import { discussionPlugin } from '@/components/plate-editor/components/discussion-kit';

/**
 * Resolves a discussion: marks it resolved locally, then persists via the
 * API callback. The comment mark stays in the document — `CommentLeaf`
 * stops highlighting it once its discussion is resolved, and
 * `useResolvedDiscussion` filters it out of the popover — so reopening
 * later (`useUnresolveDiscussion`) can restore the highlight without
 * having lost the anchor.
 */
export function useResolveDiscussion() {
  const editor = useEditorRef();
  const callbacks = usePluginOption(discussionPlugin, 'callbacks');

  return React.useCallback(
    (discussionId: string) => {
      const updated = editor
        .getOption(discussionPlugin, 'discussions')
        .map((discussion) =>
          discussion.id === discussionId
            ? { ...discussion, isResolved: true }
            : discussion
        );
      editor.setOption(discussionPlugin, 'discussions', updated);

      // Clear focus so the resolved thread's own `activeId` exception in
      // `useResolvedDiscussion` doesn't keep its popover open.
      if (editor.getOption(commentPlugin, 'activeId') === discussionId) {
        editor.setOption(commentPlugin, 'activeId', null);
      }

      void callbacks?.onResolveDiscussion?.(discussionId);
    },
    [editor, callbacks]
  );
}
