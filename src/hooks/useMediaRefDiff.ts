import { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MediaUrlContext } from '@/contexts/media-url-context';
import { normalizeMediaRefs, buildMediaRefHtmlTransformer } from '@/lib/media-ref-render';

/**
 * Normalizes the media references ({{MEDIA:<uuid>}} tokens, markdown images, raw
 * blob-storage URLs) in a pair of texts for `MarkdownDiffViewer`, and builds the
 * `transformHtml` that renders them as thumbnails/file cards. Used by the section
 * history diff (history-section-detail.tsx), whose previous_text/new_text come
 * from GET /section_executions/{id}/history unresolved — unlike
 * GET /documents/{id}/content, that endpoint doesn't substitute the tokens.
 *
 * Resolves URLs from MediaUrlContext (the same freshUrls map the document's own
 * media nodes use) — no extra request. A reference whose media isn't in that map
 * (deleted, or from a document the sheet isn't mounted under) renders as
 * "archivo no disponible", same as a broken file elsewhere in the app.
 */
export function useMediaRefDiff(oldText: string, newText: string) {
  const { freshUrls } = useContext(MediaUrlContext);
  const { t } = useTranslation('sections');
  const unavailable = t('form.fill.fileUnavailable');
  const download = t('form.fill.fileDownload');

  return useMemo(() => {
    const { texts, refs } = normalizeMediaRefs([oldText, newText], freshUrls);
    return {
      oldContent: texts[0],
      newContent: texts[1],
      transformHtml: buildMediaRefHtmlTransformer(refs, freshUrls, { unavailable, download }),
    };
    // Depende de los strings ya resueltos (unavailable/download), no de `t` —
    // su identidad cambia en cada evento de i18n y dispararía recálculos de más.
  }, [oldText, newText, freshUrls, unavailable, download]);
}
