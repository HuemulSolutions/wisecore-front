import type { NodeEntry, TCommentText, Value } from 'platejs';
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

/** Texto plano → el nodo-párrafo que el backend espera en `content_rich`. */
export const plainTextToCommentValue = (text: string): Value => [
  { type: 'p', children: [{ text }] },
];

/** Relative timestamp for a comment ("hace 4h", "ayer", "20 de mayo"). */
export const formatCommentDate = (date: Date | string) =>
  formatRelativeTime(date, { monthFormat: 'short' });

/** Absolute timestamp for a comment's tooltip. */
export const formatCommentDateAbsolute = (date: Date | string) =>
  formatRelativeTime(date, { absolute: true, showTime: true });

/**
 * Texto plano de un comentario. El contrato dice texto plano, pero el backend
 * puede enviar el Plate JSON serializado (`[{"type":"p","children":[...]}]`):
 * se aplana con `\n` entre bloques. Si no es JSON de Plate, se devuelve tal cual.
 */
export function commentPlainText(raw: string): string {
  if (!raw.trimStart().startsWith('[')) return raw;
  const flatten = (node: unknown): string => {
    if (typeof node !== 'object' || node === null) return '';
    const n = node as { text?: unknown; children?: unknown };
    if (typeof n.text === 'string') return n.text;
    if (!Array.isArray(n.children)) return '';
    const hasBlocks = n.children.some(
      (c) => typeof c === 'object' && c !== null && Array.isArray((c as { children?: unknown }).children),
    );
    return n.children.map(flatten).join(hasBlocks ? '\n' : '');
  };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return raw;
    return parsed.map(flatten).join('\n').trim();
  } catch {
    return raw;
  }
}

export { formatAbsoluteDate };
