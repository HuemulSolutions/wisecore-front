/**
 * Helpers for the `{{COMMENT:<ref>}}texto{{/COMMENT}}` marker the backend emits in AI
 * suggestions (same inline-token style as `{{MEDIA:<uuid>}}`, see plate-media-utils.ts).
 *
 * The marker can't go through the Markdown parser as-is (remarkMdx treats `{...}` as an
 * expression), so it is swapped for private-use sentinels before deserializing, and the
 * sentinels are turned into `comment_<id>` marks on the resulting Plate tree.
 */
import { getCommentKey } from '@platejs/comment';
import type { Value } from 'platejs';

const OPEN = '\uE000';
const OPEN_END = '\uE001';
const CLOSE = '\uE002';

const COMMENT_MARKER_RE = /\{\{COMMENT:([A-Za-z0-9_-]+)\}\}([\s\S]*?)\{\{\/COMMENT\}\}/g;
/** Any marker token left after pairing (orphan open/close): never shown to the user. */
const STRAY_MARKER_RE = /\{\{\/?COMMENT(?::[^}]*)?\}\}/g;
const SENTINEL_RE = new RegExp(`${OPEN}([^${OPEN_END}]*)${OPEN_END}|${CLOSE}`, 'g');
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COMMENT_MARK_PREFIX = 'comment_';
const DRAFT_MARK = 'comment_draft';

/** Inline elements share the marker state with their parent block (a marker can span a link). */
const INLINE_TYPES = new Set(['a', 'mention', 'date']);

type PlateNode = Record<string, unknown>;

export function hasCommentMarkers(markdown: string | null | undefined): boolean {
  if (!markdown) return false;
  COMMENT_MARKER_RE.lastIndex = 0;
  return COMMENT_MARKER_RE.test(markdown);
}

/** Markdown without markers: only the commented text remains. For diff, copy, preview. */
export function stripCommentMarkers(markdown: string): string {
  if (!markdown.includes('{{')) return markdown;
  return markdown.replace(COMMENT_MARKER_RE, '$2').replace(STRAY_MARKER_RE, '');
}

/** Raw text between each pair of markers (may include inline Markdown syntax). For UI preview only. */
export function collectCommentFragmentsFromMarkdown(markdown: string): Map<string, string> {
  const fragments = new Map<string, string>();
  if (!markdown.includes('{{')) return fragments;
  for (const m of markdown.matchAll(COMMENT_MARKER_RE)) {
    if (!fragments.has(m[1])) fragments.set(m[1], m[2]);
  }
  return fragments;
}

/** Swaps paired markers for sentinels; orphan tokens are dropped, keeping the plain text. */
export function markdownToCommentSentinels(markdown: string): string {
  if (!markdown.includes('{{')) return markdown;
  return markdown
    .replace(COMMENT_MARKER_RE, `${OPEN}$1${OPEN_END}$2${CLOSE}`)
    .replace(STRAY_MARKER_RE, '');
}

/** Only refs shaped like a discussion UUID survive by default (preserved discussions). */
export function defaultResolveCommentRef(ref: string): string | null {
  return UUID_RE.test(ref) ? ref : null;
}

interface MarkerState {
  /** Resolved discussion id of the open marker (null: unresolved → plain text). */
  id: string | null;
  inside: boolean;
}

function isText(node: PlateNode): boolean {
  return typeof node.text === 'string';
}

function processChildren(children: PlateNode[], state: MarkerState, resolve: (ref: string) => string | null): PlateNode[] {
  const out: PlateNode[] = [];
  for (const child of children) {
    if (isText(child)) {
      const text = child.text as string;
      if (!text.includes(OPEN) && !text.includes(CLOSE)) {
        out.push(state.inside && state.id ? withCommentMark(child, state.id) : child);
        continue;
      }
      let last = 0;
      const push = (segment: string) => {
        if (!segment) return;
        const leaf = { ...child, text: segment };
        out.push(state.inside && state.id ? withCommentMark(leaf, state.id) : leaf);
      };
      for (const m of text.matchAll(SENTINEL_RE)) {
        push(text.slice(last, m.index));
        last = (m.index ?? 0) + m[0].length;
        if (m[0] === CLOSE) {
          state.inside = false;
          state.id = null;
        } else {
          state.inside = true;
          state.id = resolve(m[1]);
        }
      }
      push(text.slice(last));
    } else {
      const el = child as PlateNode & { children?: PlateNode[]; type?: string };
      const kids = Array.isArray(el.children) ? el.children : [];
      const inline = INLINE_TYPES.has(el.type ?? '');
      out.push({
        ...el,
        children: processChildren(kids, inline ? state : { id: null, inside: false }, resolve),
      });
    }
  }
  return out.length ? out : [{ text: '' }];
}

function withCommentMark(leaf: PlateNode, id: string): PlateNode {
  return { ...leaf, comment: true, [getCommentKey(id)]: true };
}

/** Turns sentinels into `comment_<id>` marks and removes them from the text. */
export function applyCommentSentinels(
  value: Value,
  resolve: (ref: string) => string | null = defaultResolveCommentRef,
): Value {
  return processChildren(value as unknown as PlateNode[], { id: null, inside: false }, resolve) as unknown as Value;
}

function commentIdsOf(leaf: PlateNode): string[] {
  return Object.keys(leaf)
    .filter((k) => k.startsWith(COMMENT_MARK_PREFIX) && k !== DRAFT_MARK && leaf[k])
    .map((k) => k.slice(COMMENT_MARK_PREFIX.length));
}

function walkLeaves(nodes: PlateNode[], visit: (leaf: PlateNode) => void) {
  for (const node of nodes) {
    if (isText(node)) visit(node);
    else if (Array.isArray((node as { children?: unknown }).children)) {
      walkLeaves((node as { children: PlateNode[] }).children, visit);
    }
  }
}

/** Text covered by each `comment_<id>` mark, in document order (the discussion's `document_content`). */
export function collectCommentFragments(value: Value): Map<string, string> {
  const fragments = new Map<string, string>();
  walkLeaves(value as unknown as PlateNode[], (leaf) => {
    for (const id of commentIdsOf(leaf)) {
      fragments.set(id, (fragments.get(id) ?? '') + (leaf.text as string));
    }
  });
  return fragments;
}

/**
 * Renames `comment_<from>` marks to `comment_<to>`; `to === null` drops the mark (fragment stays
 * as plain text). Ids missing from `mapping` are left untouched.
 */
export function remapCommentMarks(value: Value, mapping: Map<string, string | null>): Value {
  const remap = (nodes: PlateNode[]): PlateNode[] =>
    nodes.map((node) => {
      if (isText(node)) {
        const ids = commentIdsOf(node).filter((id) => mapping.has(id));
        if (!ids.length) return node;
        const next: PlateNode = { ...node };
        for (const id of ids) {
          delete next[getCommentKey(id)];
          const to = mapping.get(id);
          if (to) next[getCommentKey(to)] = true;
        }
        if (!commentIdsOf(next).length) delete next.comment;
        return next;
      }
      const children = (node as { children?: PlateNode[] }).children;
      return Array.isArray(children) ? { ...node, children: remap(children) } : node;
    });
  return remap(value as unknown as PlateNode[]) as unknown as Value;
}
