'use client';

import * as React from 'react';

import { getDraftCommentKey } from '@platejs/comment';
import { useEditorRef, usePluginOption } from 'platejs/react';

import { commentPlugin } from '@/components/plate-editor/components/comment-kit';
import { draftEntriesToText, getDraftCommentEntries } from '@/lib/comment-utils';

/**
 * Text of the draft comment mark(s) currently selected, for the "Comentando
 * «snippet»" header of the creation popover. Recomputes only when a new
 * draft starts (`activeId`/`commentingBlock` change) — the draft marks are
 * written once by `setDraft()` and don't change while the popover is open.
 */
export function useDraftSnippet(): string {
  const editor = useEditorRef();
  const activeId = usePluginOption(commentPlugin, 'activeId');
  const commentingBlock = usePluginOption(commentPlugin, 'commentingBlock');

  return React.useMemo(() => {
    if (activeId !== getDraftCommentKey()) return '';
    return draftEntriesToText(getDraftCommentEntries(editor));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, activeId, commentingBlock]);
}
