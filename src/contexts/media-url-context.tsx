import { createContext, useContext, useMemo } from 'react'
import { isMediaToken } from '@/lib/plate-media-utils'

interface MediaUrlContextValue {
  /**
   * Latest {mediaId: freshUrl} map from GET /documents/{id}/media_urls.
   * `null` before the first successful refresh — node renderers should fall
   * back to whatever url/previewUrl the document content already provided.
   */
  freshUrls: Record<string, string> | null
}

export const MediaUrlContext = createContext<MediaUrlContextValue>({ freshUrls: null })

export function MediaUrlProvider({
  freshUrls,
  children,
}: {
  freshUrls: Record<string, string> | null
  children: React.ReactNode
}) {
  // Memoized so a re-render of AssetContent that doesn't actually change
  // freshUrls (e.g. a polling tick) doesn't hand every media node in every
  // section a new context value — that would re-render them all even though
  // React.memo on the section itself said "no change" (context reads bypass
  // memo comparisons entirely).
  const value = useMemo(() => ({ freshUrls }), [freshUrls])

  return (
    <MediaUrlContext.Provider value={value}>
      {children}
    </MediaUrlContext.Provider>
  )
}

interface MediaNodeLike {
  mediaId?: string
  url?: string
  previewUrl?: string
}

export interface ResolvedMediaUrl {
  /** URL to use as src/href, or '' when there is nothing usable. */
  src: string
  /** True when the media is known to be unavailable (deleted / no access). */
  isBroken: boolean
}

/**
 * Resolve the URL to render for an image/file/video/audio node, preferring
 * the freshest source available:
 *   1. The live {{MEDIA:<uuid>}} -> url map from /media_urls, when the node
 *      carries a mediaId that appears in it (covers url AND previewUrl,
 *      since they point at the same file).
 *   2. The node's own `url`, when it is already a resolved (non-token) URL.
 *   3. The node's `previewUrl`, when `url` is still an unresolved token
 *      (fresh upload, not yet saved/reloaded).
 * A node whose only usable value is still a raw token — and whose mediaId
 * (if any) is not in the fresh map — is reported as broken instead of trying
 * to load the literal "{{MEDIA:...}}" string as a URL.
 */
export function useResolvedMediaUrl(node: MediaNodeLike): ResolvedMediaUrl {
  const { freshUrls } = useContext(MediaUrlContext)

  if (node.mediaId && freshUrls && node.mediaId in freshUrls) {
    return { src: freshUrls[node.mediaId], isBroken: false }
  }

  const urlIsToken = isMediaToken(node.url)
  const candidate = urlIsToken ? (node.previewUrl || node.url) : node.url

  if (!candidate || isMediaToken(candidate)) {
    return { src: '', isBroken: true }
  }

  return { src: candidate, isBroken: false }
}
