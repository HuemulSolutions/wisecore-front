/**
 * Snapshot bookkeeping for the `mermaid` Plate node. Word/Markdown exports can't
 * render Mermaid server-side, so before a section is persisted every mermaid node
 * needs its `code` rasterized to a PNG and uploaded as media – `url` then becomes
 * the `{{MEDIA:<uuid>}}` placeholder the backend resolves at export time (same
 * mechanism as normal images, see `plate-media-utils.ts`).
 *
 * Re-rendering and re-uploading a snapshot on every save (even unrelated edits
 * elsewhere in the section) would spam the media store, so each node remembers the
 * code it last snapshotted (`snapshotCode`) and only re-renders when `code` changed.
 */
import { renderMermaidPngFile } from '@/lib/mermaid-snapshot';
import { mediaTokenFor } from '@/lib/plate-media-utils';

export const MERMAID_KEY = 'mermaid';

/** Uploads a rasterized PNG file as media and returns the new media id. */
export type MermaidSnapshotUploader = (file: File) => Promise<{ id: string }>;

export interface EnsureMermaidSnapshotsResult {
  /** The (possibly updated) node tree, safe to feed back into `editor.tf.setValue`. */
  value: unknown[];
  /** Number of mermaid nodes whose snapshot failed to render/upload (kept without `url`). */
  failed: number;
}

/**
 * Recursively walks a Plate `Value`, rendering + uploading a fresh snapshot for every
 * `mermaid` node whose `code` differs from its last snapshotted `snapshotCode` (or that
 * has none yet). Nodes with empty `code`, or whose code didn't change, are returned as-is.
 *
 * A render/upload failure for one diagram does not abort the others – it's counted in
 * `failed` and that node keeps (or loses) its previous `url` untouched.
 */
export async function ensureMermaidSnapshots(
  nodes: unknown[],
  upload: MermaidSnapshotUploader,
): Promise<EnsureMermaidSnapshotsResult> {
  let failed = 0;

  const walk = async (node: unknown): Promise<unknown> => {
    if (typeof node !== 'object' || node === null) return node;
    if ('text' in node) return node;

    const el = node as Record<string, unknown>;
    const children = Array.isArray(el.children)
      ? await Promise.all((el.children as unknown[]).map(walk))
      : el.children;

    if (el.type !== MERMAID_KEY) {
      return children === el.children ? el : { ...el, children };
    }

    const code = typeof el.code === 'string' ? el.code : '';
    const snapshotCode = typeof el.snapshotCode === 'string' ? el.snapshotCode : undefined;
    const hasSnapshot = typeof el.mediaId === 'string' && !!el.mediaId;

    if (!code.trim() || (hasSnapshot && code === snapshotCode)) {
      return { ...el, children };
    }

    try {
      const file = await renderMermaidPngFile(code);
      const media = await upload(file);
      return {
        ...el,
        children,
        mediaId: media.id,
        url: mediaTokenFor(media.id),
        snapshotCode: code,
      };
    } catch {
      failed += 1;
      return { ...el, children };
    }
  };

  const value = await Promise.all(nodes.map(walk));
  return { value, failed };
}
