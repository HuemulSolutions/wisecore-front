import type { TFileElement, TImageElement } from 'platejs'

/**
 * `plate_content` shape for a media-reference node backed by an org media asset
 * (inserted from the "Insertar referencia de recurso" picker, or by uploading a
 * file/image from the editor toolbar). `url` holds the `{{MEDIA:<uuid>}}`
 * placeholder token — see `src/lib/plate-media-utils.ts` — never a resolved URL.
 *
 * `contentType`/`fileSize` are a snapshot taken at insertion time (from the
 * media's current version, or from the browser `File` on upload): cheap to
 * render (icon + size) without a request per node, at the cost of going stale
 * if a newer version is later uploaded. Acceptable per `ia context/plate-custom-node-guide.md`
 * §4 — nothing here is re-resolved live at serialize time.
 */
export interface MediaFileElement extends TFileElement {
  /** Media id backing `url` — required to resolve/refresh and to re-tokenize on save. */
  mediaId?: string
  /** Resolved download URL captured at insertion time, used until the first `/media_urls` refresh. */
  previewUrl?: string
  /** MIME type of the referenced media's current version, e.g. `application/pdf`. */
  contentType?: string
  /** Byte size of the referenced media's current version. */
  fileSize?: number
}

export interface MediaImageElement extends TImageElement {
  mediaId?: string
  previewUrl?: string
}
