'use client';

import * as React from 'react';

import { CommentPlugin } from '@platejs/comment/react';
import { useEditorPlugin, useEditorRef, usePluginOption } from 'platejs/react';

import { discussionPlugin } from '@/components/plate-editor/components/discussion-kit';

/**
 * Resolves a discussion: marks it resolved locally, removes the comment
 * mark from the document, then persists via the API callback.
 *
 * Order matters (do not add `await` before `unsetMark`): the optimistic
 * `setOption` makes the thread disappear from `useResolvedDiscussion`
 * (it filters `!isResolved`), so the mark must be removed synchronously
 * right after, before the component that reads `activeId` can re-render
 * against a mark whose owning discussion no longer resolves.
 */
export function useResolveDiscussion() {
  const editor = useEditorRef();
  const callbacks = usePluginOption(discussionPlugin, 'callbacks');
  const { tf } = useEditorPlugin(CommentPlugin);

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

      tf.comment.unsetMark({ id: discussionId });

      void callbacks?.onResolveDiscussion?.(discussionId);
    },
    [editor, callbacks, tf]
  );
}
