import type { TElement } from 'platejs'

/**
 * plate_content shape for a Mermaid diagram block, per the backend contract:
 * same shape as the `img` node (url/width/caption) plus `code` for editability.
 *
 * `snapshotCode` is frontend-only bookkeeping (not part of the documented contract):
 * it records the diagram code that was last rasterized into `url`'s media, so
 * `ensureMermaidSnapshots` can skip re-uploading a snapshot when the code hasn't
 * changed since the last save.
 */
export interface TMermaidElement extends TElement {
  /** Mermaid source code – always kept, so the diagram stays editable. */
  code?: string
  /** `{{MEDIA:<uuid>}}` placeholder for the rasterized snapshot, or empty/null if none yet. */
  url?: string | null
  /** Media id backing `url`, once a snapshot has been uploaded. */
  mediaId?: string
  /** Mermaid code that produced the current `url` snapshot – used to detect staleness. */
  snapshotCode?: string
  /** Width as %, px or in – same convention as the `img` node. */
  width?: string | number
  /** Caption shown centered below the image, same convention as the `img` node. */
  caption?: { text: string }[]
}
