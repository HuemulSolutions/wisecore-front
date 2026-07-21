/**
 * Shared helpers for the {{MEDIA:<uuid>}} placeholder token used across the Plate
 * editor. The backend persists this token in place of a real URL for any media
 * field (image/file/video/audio `url`, and `previewUrl`) and resolves it to a
 * freshly-signed download URL on every `GET /documents/{id}/content` (or
 * `/media_urls`) call. Keeping the regex and helpers in one place avoids the
 * token format drifting between the markdown serializer and the node renderers.
 */

/** Matches a full-string {{MEDIA:<uuid>}} token. */
export const MEDIA_TOKEN_RE = /^\{\{MEDIA:([0-9a-f-]{36})\}\}$/i;

/** Whether `value` is (in full) an unresolved {{MEDIA:<uuid>}} token. */
export function isMediaToken(value: unknown): value is string {
  return typeof value === 'string' && MEDIA_TOKEN_RE.test(value);
}

/** Build the placeholder token for a given media id. */
export function mediaTokenFor(mediaId: string): string {
  return `{{MEDIA:${mediaId}}}`;
}

/**
 * Recursively rewrite `url` and `previewUrl` back to the {{MEDIA:<uuid>}}
 * placeholder for every node that carries a `mediaId`, before persisting
 * plate_content. Without this, a node whose `previewUrl` was left as the
 * resolved SAS URL from upload time never gets re-resolved by the backend
 * (it only replaces exact token matches) and expires permanently ~1h later.
 *
 * Nodes without `mediaId` (legacy content, or non-media nodes) are left as-is.
 */
export function normalizePlateMediaForSave(nodes: unknown[]): unknown[] {
  return nodes.map((node) => normalizeNode(node));
}

function normalizeNode(node: unknown): unknown {
  if (typeof node !== 'object' || node === null) return node;
  if ('text' in node) return node;

  const el = node as Record<string, unknown>;
  const children = Array.isArray(el.children)
    ? (el.children as unknown[]).map((child) => normalizeNode(child))
    : el.children;

  const mediaId = el.mediaId;
  if (typeof mediaId !== 'string' || !mediaId) {
    return children === el.children ? el : { ...el, children };
  }

  const token = mediaTokenFor(mediaId);
  const next: Record<string, unknown> = { ...el, children };
  if (typeof el.url === 'string') next.url = token;
  if (typeof el.previewUrl === 'string') next.previewUrl = token;
  return next;
}
