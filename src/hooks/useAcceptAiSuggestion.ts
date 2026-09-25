import { useCallback, type RefObject } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { logger } from '@/lib/logger';
import {
  collectCommentFragments,
  hasCommentMarkers,
  remapCommentMarks,
} from '@/lib/plate-comment-markers';
import { normalizeDataTableNodesInTree } from '@/lib/plate-data-table-utils';
import { normalizePlateMediaForSave } from '@/lib/plate-media-utils';
import { discussionQueryKeys } from '@/hooks/useDiscussions';
import { createDiscussionWithComment, listDiscussions } from '@/services/discussions';
import { acceptAiSuggestion, getAiSuggestion, modifyContent } from '@/services/section_execution';
import type { SectionPlateEditorRef } from '@/types/section-plate-editor';
import type { AiSuggestionStatus } from '@/types/section-execution';
import type { Value } from 'platejs';

interface UseAcceptAiSuggestionOptions {
  sectionExecutionId: string;
  documentId?: string;
  organizationId?: string;
  editorRef: RefObject<SectionPlateEditorRef | null>;
}

const asRichText = (text: string) => JSON.stringify([{ type: 'p', children: [{ text }] }]);

/**
 * Acepta una sugerencia de IA y, si trae marcadores `{{COMMENT:...}}`, los convierte en marks
 * de comentario: crea las discusiones nuevas (`is_new`, `author_type: 'ai'`), reutiliza las
 * preservadas y persiste el `plate_content` resultante (el backend lo deja en null al aceptar).
 * Un fallo posterior al accept no lo revierte: los fragmentos afectados quedan como texto plano.
 * Solo el accept en sí propaga error.
 */
export function useAcceptAiSuggestion({
  sectionExecutionId,
  documentId,
  organizationId,
  editorRef,
}: UseAcceptAiSuggestionOptions) {
  const queryClient = useQueryClient();
  const { t } = useTranslation('assets');

  const anchorComments = useCallback(
    async (suggestion: AiSuggestionStatus) => {
      const editor = editorRef.current;
      const content = suggestion.content ?? '';
      const comments = suggestion.comments ?? [];
      if (!editor || !documentId || !organizationId || (!comments.length && !hasCommentMarkers(content))) return;

      // Marks temporales con el ref crudo, para leer el texto de cada fragmento.
      editor.resetContent(content, { resolveCommentRef: (ref) => ref });
      const value = editor.getValue();
      const fragments = collectCommentFragments(value);
      if (!fragments.size) return;

      const newBodies = new Map(
        comments.filter((c) => c.is_new && c.body).map((c) => [c.ref, c.body as string]),
      );

      // Discusiones preservadas: solo valen las que existen en esta sección.
      const existing = await queryClient.fetchQuery({
        queryKey: discussionQueryKeys.byDocument(documentId),
        queryFn: () =>
          listDiscussions({ document_id: documentId, include_comments: true, page_size: 500 }, organizationId),
        staleTime: 30_000,
      });
      const existingIds = new Set(
        (existing.data ?? []).filter((d) => d.section_execution_id === sectionExecutionId).map((d) => d.id),
      );

      let failed = 0;
      const mapping = new Map<string, string | null>();
      await Promise.all(
        [...fragments.entries()].map(async ([ref, fragment]) => {
          const body = newBodies.get(ref);
          if (body && fragment) {
            try {
              const discussion = await createDiscussionWithComment(
                {
                  document_id: documentId,
                  section_execution_id: sectionExecutionId,
                  document_content: fragment,
                  content_rich: asRichText(body),
                  is_public: true,
                  author_type: 'ai',
                },
                organizationId,
              );
              mapping.set(ref, discussion.id);
            } catch (error) {
              logger.error('Error creating AI comment discussion', error);
              failed += 1;
              mapping.set(ref, null);
            }
            return;
          }
          mapping.set(ref, existingIds.has(ref) ? ref : null);
        }),
      );

      const anchored = remapCommentMarks(value, mapping) as Value;
      editor.resetValue(anchored);
      const normalized = normalizePlateMediaForSave(normalizeDataTableNodesInTree(anchored));
      await modifyContent(
        sectionExecutionId,
        editor.getMarkdown(),
        normalized.map((node) => JSON.stringify(node)),
      );
      queryClient.invalidateQueries({ queryKey: discussionQueryKeys.byDocument(documentId) });
      if (failed > 0) toast.warning(t('section.aiSuggestionCommentsFailed'));
    },
    [documentId, editorRef, organizationId, queryClient, sectionExecutionId, t],
  );

  return useCallback(async () => {
    // Antes del accept: después el backend limpia la sugerencia y se pierde `comments`.
    let suggestion: AiSuggestionStatus | null = null;
    try {
      suggestion = await getAiSuggestion(sectionExecutionId, organizationId);
    } catch (error) {
      logger.error('Error reading AI suggestion before accept', error);
    }

    await acceptAiSuggestion(sectionExecutionId, organizationId);

    if (!suggestion) return;
    try {
      await anchorComments(suggestion);
    } catch (error) {
      logger.error('Error anchoring AI comments after accept', error);
      toast.warning(t('section.aiSuggestionCommentsFailed'));
    }
  }, [anchorComments, organizationId, sectionExecutionId, t]);
}
