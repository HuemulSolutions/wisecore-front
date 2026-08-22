'use client';

import * as React from 'react';

import type { PlateElementProps, RenderNodeWrapper } from 'platejs/react';

import { getDraftCommentKey } from '@platejs/comment';
import { CommentPlugin } from '@platejs/comment/react';
import { getTransientSuggestionKey } from '@platejs/suggestion';
import { SuggestionPlugin } from '@platejs/suggestion/react';
import {
  type AnyPluginConfig,
  type NodeEntry,
  type Path,
  type TCommentText,
  type TElement,
  type TSuggestionText,
  PathApi,
  TextApi,
} from 'platejs';
import { useEditorRef, usePluginOption } from 'platejs/react';

import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { commentPlugin } from '@/components/plate-editor/components/comment-kit';
import type { TDiscussion } from '@/components/plate-editor/components/discussion-kit';
import { suggestionPlugin } from '@/components/plate-editor/components/suggestion-kit';

import {
  BlockSuggestionCard,
  isResolvedSuggestion,
  useResolveSuggestion,
} from './block-suggestion';
import { cancelDraftComment } from './comment-draft-actions';
import { DiscussionCreatePopover } from './discussion-create-popover';
import { DiscussionMarginIndicator } from './discussion-margin-indicator';
import { DiscussionThreadCard } from './discussion-thread-card';
import { useResolvedDiscussion } from './useResolvedDiscussion';

export const BlockDiscussion: RenderNodeWrapper<AnyPluginConfig> = (props) => {
  const { editor, element } = props;

  const commentsApi = editor.getApi(CommentPlugin).comment;
  const blockPath = editor.api.findPath(element);

  // avoid duplicate in table or column
  if (!blockPath || blockPath.length > 1) return;

  const draftCommentNode = commentsApi.node({ at: blockPath, isDraft: true });

  const commentNodes = [...commentsApi.nodes({ at: blockPath })];

  const suggestionNodes = [
    ...editor.getApi(SuggestionPlugin).suggestion.nodes({ at: blockPath }),
  ].filter(([node]) => !node[getTransientSuggestionKey()]);

  if (
    commentNodes.length === 0 &&
    suggestionNodes.length === 0 &&
    !draftCommentNode
  ) {
    return;
  }

  return (props) => (
    <BlockCommentContent
      blockPath={blockPath}
      commentNodes={commentNodes}
      draftCommentNode={draftCommentNode}
      suggestionNodes={suggestionNodes}
      {...props}
    />
  );
};

const BlockCommentContent = ({
  blockPath,
  children,
  commentNodes,
  draftCommentNode,
  element,
  suggestionNodes,
}: PlateElementProps & {
  blockPath: Path;
  commentNodes: NodeEntry<TCommentText>[];
  draftCommentNode: NodeEntry<TCommentText> | undefined;
  suggestionNodes: NodeEntry<TElement | TSuggestionText>[];
}) => {
  const editor = useEditorRef();
  const resolvedSuggestions = useResolveSuggestion(suggestionNodes, blockPath);
  const resolvedDiscussions = useResolvedDiscussion(commentNodes, blockPath);

  const suggestionsCount = resolvedSuggestions.length;
  const discussionsCount = resolvedDiscussions.reduce(
    (n, d) => n + d.comments.length,
    0
  );
  const totalCount = suggestionsCount + resolvedDiscussions.length;

  const newestDiscussion = resolvedDiscussions.reduce<TDiscussion | undefined>(
    (acc, d) =>
      !acc || d.createdAt.getTime() > acc.createdAt.getTime() ? d : acc,
    undefined
  );
  const lastAuthorId = newestDiscussion?.comments.at(-1)?.userId;
  const highlightId = newestDiscussion?.id;

  const activeSuggestionId = usePluginOption(suggestionPlugin, 'activeId');
  const activeSuggestion =
    activeSuggestionId &&
    resolvedSuggestions.find((s) => s.suggestionId === activeSuggestionId);

  const commentingBlock = usePluginOption(commentPlugin, 'commentingBlock');
  const activeCommentId = usePluginOption(commentPlugin, 'activeId');
  const isCommenting = activeCommentId === getDraftCommentKey();
  const activeDiscussion =
    activeCommentId &&
    resolvedDiscussions.find((d) => d.id === activeCommentId);

  const noneActive = !activeSuggestion && !activeDiscussion;

  const sortedMergedData = [
    ...resolvedDiscussions,
    ...resolvedSuggestions,
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const selected =
    resolvedDiscussions.some((d) => d.id === activeCommentId) ||
    resolvedSuggestions.some((s) => s.suggestionId === activeSuggestionId);

  const [_open, setOpen] = React.useState(selected);

  // in some cases, we may comment the multiple blocks
  const commentingCurrent =
    !!commentingBlock && PathApi.equals(blockPath, commentingBlock);

  const open =
    _open ||
    selected ||
    (isCommenting && !!draftCommentNode && commentingCurrent);

  const resolveAnchorElement = React.useCallback(() => {
    let activeNode: NodeEntry | undefined;

    if (activeSuggestion) {
      activeNode = suggestionNodes.find(
        ([node]) =>
          TextApi.isText(node) &&
          editor.getApi(SuggestionPlugin).suggestion.nodeId(node) ===
            activeSuggestion.suggestionId
      );
    }

    if (activeCommentId) {
      if (activeCommentId === getDraftCommentKey()) {
        activeNode = draftCommentNode;
      } else {
        activeNode = commentNodes.find(
          ([node]) =>
            editor.getApi(commentPlugin).comment.nodeId(node) ===
            activeCommentId
        );
      }
    }

    // Fallback: si el nodo activo aún no tiene entrada en el DOM (por
    // ejemplo, justo después de crear la mark draft), anclamos al bloque
    // para nunca quedarnos sin referencia.
    const target = activeNode?.[0] ?? element;

    return editor.api.toDOMNode(target) ?? null;
  }, [
    activeSuggestion,
    activeCommentId,
    editor,
    element,
    suggestionNodes,
    draftCommentNode,
    commentNodes,
  ]);

  const [anchorElement, setAnchorElement] =
    React.useState<HTMLElement | null>(null);

  // `toDOMNode` sólo resuelve contra nodos ya montados. Al crear un draft,
  // slate-react todavía no pobló el WeakMap del nodo nuevo en el mismo pass
  // de render, así que resolvemos el ancla en un layout effect (post-commit)
  // en vez de en un useMemo (durante el render).
  React.useLayoutEffect(() => {
    if (!open) return;

    setAnchorElement(resolveAnchorElement());
  }, [open, resolveAnchorElement]);

  if (suggestionsCount + resolvedDiscussions.length === 0 && !draftCommentNode)
    return <div className="w-full">{children}</div>;

  return (
    <div className="flex w-full justify-between">
      <Popover
        open={open}
        onOpenChange={(_open_) => {
          if (!_open_ && isCommenting && draftCommentNode) {
            cancelDraftComment(editor);
          }
          setOpen(_open_);
        }}
      >
        <div className="w-full">{children}</div>
        {anchorElement && (
          <PopoverAnchor
            asChild
            className="w-full"
            virtualRef={{ current: anchorElement }}
          />
        )}

        {anchorElement && (
          <PopoverContent
            className="w-[380px] min-w-[130px] max-w-[calc(100vw-24px)] overflow-visible border-none bg-transparent p-0 shadow-none data-[state=closed]:opacity-0"
            onCloseAutoFocus={(e) => e.preventDefault()}
            onOpenAutoFocus={(e) => e.preventDefault()}
            align="center"
            side="bottom"
          >
            {isCommenting ? (
              <DiscussionCreatePopover className="rounded-xl border border-[#c9d4e3] bg-white shadow-comment-popover" />
            ) : (
              <div className="max-h-[min(50dvh,calc(-24px+var(--radix-popper-available-height)))] overflow-hidden overflow-y-auto rounded-xl border border-[#c9d4e3] bg-white shadow-comment-thread">
                <div className="divide-y divide-[#eef2f7]">
                  {noneActive ? (
                    sortedMergedData.map((item) =>
                      isResolvedSuggestion(item) ? (
                        <BlockSuggestionCard
                          key={item.suggestionId}
                          suggestion={item}
                        />
                      ) : (
                        <DiscussionThreadCard key={item.id} discussion={item} />
                      )
                    )
                  ) : (
                    <>
                      {activeSuggestion && (
                        <BlockSuggestionCard
                          key={activeSuggestion.suggestionId}
                          suggestion={activeSuggestion}
                        />
                      )}

                      {activeDiscussion && (
                        <DiscussionThreadCard discussion={activeDiscussion} />
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </PopoverContent>
        )}

        {totalCount > 0 && (
          <div className="relative left-0 size-0 select-none">
            <PopoverTrigger asChild>
              <DiscussionMarginIndicator
                isActive={open}
                commentCount={discussionsCount}
                suggestionCount={suggestionsCount}
                lastAuthorId={lastAuthorId}
                highlightId={highlightId}
              />
            </PopoverTrigger>
          </div>
        )}
      </Popover>
    </div>
  );
};
