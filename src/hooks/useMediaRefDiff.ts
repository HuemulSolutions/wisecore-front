import { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MediaUrlContext } from '@/contexts/media-url-context';
import { normalizeMediaRefs, buildMediaRefHtmlTransformer } from '@/lib/media-ref-render';

/**
 * Normalizes the media references ({{MEDIA:<uuid>}} tokens, markdown images, raw
 * blob-storage URLs) in a pair of texts for `MarkdownDiffViewer`, and builds the
 * `transformHtml` that renders them as thumbnails/file cards. Used by the section
 * history diff (history-section-detail.tsx), whose previous_text/new_text come
 * from GET /section_executions/{id}/history with tokens already resolved to signed
 * URLs by backend (a token left unresolved means deleted/inaccessible media).
 *
 * MediaUrlContext (the freshUrls map the document's own media nodes use) is
 * optional: when the sheet is mounted under its provider it renews the signature,
 * otherwise the URL in the text is used. No extra request. A reference with no
 * usable URL renders as "archivo no disponible", same as a broken file elsewhere.
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
