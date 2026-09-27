/**
 * Renders {{MEDIA:<uuid>}} tokens, markdown images and raw blob-storage URLs that
 * show up inside a section-history diff (see history-section-detail.tsx) as actual
 * thumbnails/file cards, instead of the raw reference.
 *
 * GET /section_executions/{id}/history resolves {{MEDIA:<uuid>}} to a signed URL
 * (same as GET /documents/{id}/content), with one stable signature per media in a
 * response. previous_text/new_text can still contain any of:
 *   - an already-resolved  https://<account>.blob.core.windows.net/... SAS URL
 *     (what backend emits now, plus legacy entries)
 *   - a bare token:        {{MEDIA:<uuid>}} — backend leaves it unresolved when the
 *     media was deleted or is inaccessible (rendered as "archivo no disponible")
 *   - a markdown image:    ![alt]({{MEDIA:<uuid>}})  or  ![alt](https://...)
 *
 * Two-phase approach (see normalizeMediaRefs / buildMediaRefHtmlTransformer):
 *   1. Before diffing: replace every reference with a `{{MEDIAREF:<key>}}` sentinel
 *      that has no whitespace/markdown-active characters, so the LCS word-diff
 *      (MarkdownDiffViewer's `tokenize`) never splits it, and the SAME file gets
 *      the SAME key on both sides of the diff even if its SAS signature rotated
 *      between the two responses — otherwise every refresh would look like a
 *      delete+add of the same file.
 *   2. After the HTML is built: replace each sentinel with the actual <img>/<a>.
 *      `String.replace` never rescans what the callback returns, so the emitted
 *      markup is never re-processed.
 */
import { MEDIA_TOKEN_RE, MEDIA_TOKEN_GLOBAL_RE } from '@/lib/plate-media-utils';
import { inferFromUrl } from '@/huemul/components/huemul-file-preview';
import { isImage, EXTENSION_MIME } from '@/huemul/components/huemul-media-icon';

export interface MediaRef {
  key: string;
  /** Set when the reference resolves through MediaUrlContext's freshUrls map. */
  mediaId?: string;
  /** Direct URL — either the only thing we have (legacy SAS text) or a fallback. */
  url?: string;
  /** From a markdown image's alt text, or inferred from the URL's filename. */
  displayName?: string;
}

export interface NormalizeMediaRefsResult {
  texts: string[];
  refs: Map<string, MediaRef>;
}

const SENTINEL_RE = /\{\{MEDIAREF:([A-Za-z0-9_-]+)\}\}/g;
const MD_IMAGE_RE = /!\[([^\]\n]*)\]\(\s*(\{\{MEDIA:[0-9a-f-]{36}\}\}|https?:\/\/[^\s)]+)\s*\)/gi;
// Deliberately narrow (only azure blob storage hosts) so a normal link the user
// wrote in the text is never swallowed as a media reference.
const BLOB_URL_RE = /https?:\/\/[a-z0-9-]+\.blob\.core\.windows\.net\/[^\s"'<>)\]]+/gi;

function hashKey(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16);
}

/** Identity used to dedupe a URL regardless of its (rotating) SAS signature. */
function urlIdentity(rawUrl: string): { key: string; displayName: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  const identity = `${parsed.origin}${parsed.pathname}`.toLowerCase();
  let last = parsed.pathname.split('/').pop() ?? '';
  try {
    last = decodeURIComponent(last);
  } catch {
    // Malformed %-escape in the path — keep the raw segment.
  }
  return { key: `u-${hashKey(identity)}`, displayName: last };
}

function tokenMediaId(raw: string): string | null {
  const match = MEDIA_TOKEN_RE.exec(raw);
  return match ? match[1].toLowerCase() : null;
}

function registerRef(
  refs: Map<string, MediaRef>,
  byMediaId: Map<string, string>,
  byUrlIdentity: Map<string, string>,
  raw: string,
  altText: string | undefined,
): string | null {
  const mediaId = tokenMediaId(raw);

  let key: string;
  let urlValue: string | undefined;
  let identityDisplay: string | undefined;
  let resolvedMediaId = mediaId ?? undefined;

  if (mediaId) {
    key = byMediaId.get(mediaId) ?? `m-${mediaId}`;
    byMediaId.set(mediaId, key);
  } else {
    const identity = urlIdentity(raw);
    if (!identity) return null;
    // May resolve to an existing "m-<mediaId>" key when freshUrls already maps
    // that same file — see the pre-seeding loop in normalizeMediaRefs.
    key = byUrlIdentity.get(identity.key) ?? identity.key;
    byUrlIdentity.set(identity.key, key);
    urlValue = raw;
    identityDisplay = identity.displayName;
    if (key.startsWith('m-')) resolvedMediaId = key.slice(2);
  }

  const existing = refs.get(key);
  if (existing) {
    if (altText && !existing.displayName) existing.displayName = altText;
    if (!existing.url && urlValue) existing.url = urlValue;
    if (!existing.mediaId && resolvedMediaId) existing.mediaId = resolvedMediaId;
    return `{{MEDIAREF:${key}}}`;
  }

  refs.set(key, {
    key,
    mediaId: resolvedMediaId,
    url: urlValue,
    displayName: altText || identityDisplay,
  });
  return `{{MEDIAREF:${key}}}`;
}

/**
 * Phase 1 — replaces every media reference across all `texts` with a shared
 * sentinel per underlying file. Call with [previous_text, new_text] together so
 * the same file gets the same key on both sides.
 */
export function normalizeMediaRefs(
  texts: string[],
  freshUrls: Record<string, string> | null,
): NormalizeMediaRefsResult {
  const refs = new Map<string, MediaRef>();
  const byMediaId = new Map<string, string>();
  const byUrlIdentity = new Map<string, string>();

  // Pre-seed: a resolved URL whose identity matches a mediaId in freshUrls collapses
  // onto that mediaId's key, so a token in one text and its (already backend-
  // resolved) URL in the other are recognized as the same file.
  if (freshUrls) {
    for (const [mediaId, url] of Object.entries(freshUrls)) {
      const identity = urlIdentity(url);
      if (identity) byUrlIdentity.set(identity.key, `m-${mediaId.toLowerCase()}`);
    }
  }

  const normalizedTexts = texts.map((text) => {
    // Neutralize any sentinel-looking text already present (forged or pasted by a
    // user) so it can't collide with — or be mistaken for — a real one.
    let out = text.replace(/\{\{MEDIAREF:/gi, '{{ MEDIAREF:');

    out = out.replace(MD_IMAGE_RE, (full, alt: string, ref: string) => {
      const sentinel = registerRef(refs, byMediaId, byUrlIdentity, ref, alt || undefined);
      return sentinel ?? full;
    });

    out = out.replace(MEDIA_TOKEN_GLOBAL_RE, (full) => {
      const sentinel = registerRef(refs, byMediaId, byUrlIdentity, full, undefined);
      return sentinel ?? full;
    });

    out = out.replace(BLOB_URL_RE, (full) => {
      const sentinel = registerRef(refs, byMediaId, byUrlIdentity, full, undefined);
      return sentinel ?? full;
    });

    return out;
  });

  return { texts: normalizedTexts, refs };
}

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]);
}

// Hand-copied lucide-react path data (FileText/File/Download/FileX) — can't render
// the actual React icon components inside dangerouslySetInnerHTML.
const ICON_FILE_TEXT =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
  `stroke-linecap="round" stroke-linejoin="round" class="size-3.5 shrink-0 text-orange-500" aria-hidden="true">` +
  `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>` +
  `<path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`;
const ICON_FILE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
  `stroke-linecap="round" stroke-linejoin="round" class="size-3.5 shrink-0 text-gray-400" aria-hidden="true">` +
  `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`;
const ICON_DOWNLOAD =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
  `stroke-linecap="round" stroke-linejoin="round" class="size-3 shrink-0 text-gray-400" aria-hidden="true">` +
  `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`;
const ICON_FILE_X =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
  `stroke-linecap="round" stroke-linejoin="round" class="size-3 shrink-0" aria-hidden="true">` +
  `<path d="M14.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v9"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>` +
  `<path d="m3 12.5 5 5"/><path d="m8 12.5-5 5"/></svg>`;

function renderUnavailable(label: string): string {
  return (
    `<span class="inline-flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 ` +
    `dark:border-gray-600 px-2 py-1 align-middle text-xs italic text-gray-400">${ICON_FILE_X}${escapeHtml(label)}</span>`
  );
}

function renderRef(
  ref: MediaRef | undefined,
  freshUrls: Record<string, string> | null,
  labels: { unavailable: string; download: string },
): string {
  // Same priority as useResolvedMediaUrl: the live map by mediaId first (optional
  // signature refresh), the reference's own URL (backend-resolved text) otherwise.
  const resolvedUrl = (ref?.mediaId && freshUrls?.[ref.mediaId]) || ref?.url || '';
  if (!ref || !resolvedUrl) return renderUnavailable(labels.unavailable);

  let parsed: URL;
  try {
    parsed = new URL(resolvedUrl);
  } catch {
    return renderUnavailable(labels.unavailable);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return renderUnavailable(labels.unavailable);
  }

  const { name, extension } = inferFromUrl(resolvedUrl);
  const displayName = ref.displayName || name || labels.download;
  const contentType = EXTENSION_MIME[extension];
  const href = escapeHtml(resolvedUrl);
  const title = escapeHtml(displayName);

  if (isImage(contentType)) {
    return (
      `<a href="${href}" target="_blank" rel="noopener noreferrer" title="${title}" ` +
      `class="inline-block align-middle no-underline">` +
      `<img src="${href}" alt="${title}" loading="lazy" ` +
      `class="inline-block rounded border border-gray-200 dark:border-gray-700 object-contain align-middle" ` +
      `style="max-height:7rem;max-width:100%;" /></a>`
    );
  }

  const icon = contentType?.includes('pdf') || contentType?.startsWith('text/') ? ICON_FILE_TEXT : ICON_FILE;
  return (
    `<a href="${href}" target="_blank" rel="noopener noreferrer" title="${title}" ` +
    `class="inline-flex max-w-full items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-700 ` +
    `px-2 py-1 align-middle text-xs text-gray-700 dark:text-gray-300 no-underline hover:bg-gray-50">` +
    `${icon}<span class="truncate" style="max-width:14rem;">${escapeHtml(displayName)}</span>${ICON_DOWNLOAD}</a>`
  );
}

/**
 * Phase 2 — returns a transform that swaps every `{{MEDIAREF:<key>}}` sentinel
 * left in a diff's rendered HTML for the actual thumbnail/file-card/unavailable
 * markup. Meant to be applied exactly once, on the HTML string produced from the
 * text `normalizeMediaRefs` returned (see MarkdownDiffViewer's `transformHtml`).
 */
export function buildMediaRefHtmlTransformer(
  refs: Map<string, MediaRef>,
  freshUrls: Record<string, string> | null,
  labels: { unavailable: string; download: string },
): (html: string) => string {
  return (html: string) => html.replace(SENTINEL_RE, (_, key: string) => renderRef(refs.get(key), freshUrls, labels));
}
