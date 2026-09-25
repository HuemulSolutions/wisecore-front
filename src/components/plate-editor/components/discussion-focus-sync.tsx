'use client';

import * as React from 'react';

import { useEditorRef } from 'platejs/react';

import { useDiscussionFocus } from '@/contexts/discussion-focus-context';

import { commentPlugin } from './comment-kit';

export interface DiscussionFocusSyncProps {
  sectionExecutionId: string;
}

/**
 * Bridges DiscussionFocusContext requests into this editor's
 * `commentPlugin.activeId`. Mounted once per section editor (sibling of
 * DiscussionSync) — sorts itself out via React context propagation, which
 * is not blocked by SectionExecution's `memo`.
 */
export function DiscussionFocusSync({ sectionExecutionId }: DiscussionFocusSyncProps) {
  const editor = useEditorRef();
  const { request, clearRequest } = useDiscussionFocus();
  const handledNonceRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!request) return;
    if (request.sectionExecutionId !== sectionExecutionId) return;
    if (handledNonceRef.current === request.nonce) return;
    handledNonceRef.current = request.nonce;

    const hasMark = editor.getApi(commentPlugin).comment.has({ id: request.discussionId });
    if (hasMark) {
      editor.setOption(commentPlugin, 'activeId', request.discussionId);
    }
    clearRequest(hasMark ? 'activated' : 'mark-missing');
  }, [editor, sectionExecutionId, request, clearRequest]);

  return null;
}
