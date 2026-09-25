import type { NodeEntry, TCommentText } from 'platejs';
import type { PlateEditor } from 'platejs/react';

import { CommentPlugin } from '@platejs/comment/react';

import { formatAbsoluteDate, formatRelativeTime } from '@/lib/format-relative-time';

/** Draft comment mark entries currently in the document (selection pending submission). */
export function getDraftCommentEntries(editor: PlateEditor): NodeEntry<TCommentText>[] {
  return editor.getApi(CommentPlugin).comment.nodes({ at: [], isDraft: true });
}

/** Concatenates the text of draft comment mark entries into the commented snippet. */
export function draftEntriesToText(entries: NodeEntry<TCommentText>[]): string {
  return entries.map(([node]) => node.text).join('');
}

/** Relative timestamp for a comment ("hace 4h", "ayer", "20 de mayo"). */
export const formatCommentDate = (date: Date | string) =>
  formatRelativeTime(date, { monthFormat: 'short' });

/** Absolute timestamp for a comment's tooltip. */
export const formatCommentDateAbsolute = (date: Date | string) =>
  formatRelativeTime(date, { absolute: true, showTime: true });

export { formatAbsoluteDate };
