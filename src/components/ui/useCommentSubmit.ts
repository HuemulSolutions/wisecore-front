'use client';

import * as React from 'react';

import type { Value } from 'platejs';

import { getCommentKey, getDraftCommentKey } from '@platejs/comment';
import { CommentPlugin } from '@platejs/comment/react';
import { nanoid } from 'platejs';
import { useEditorRef, usePluginOption } from 'platejs/react';

import {
  type TDiscussion,
  discussionPlugin,
} from '@/components/plate-editor/components/discussion-kit';
import { draftEntriesToText, getDraftCommentEntries } from '@/lib/comment-utils';

import type { TComment } from './comment-item';

export interface UseCommentSubmitOptions {
  /** Existing discussion to reply to, or the id of a draft comment mark. */
  discussionId?: string;
  commentValue: Value | undefined;
  isPublic: boolean;
  /** Called synchronously right before submitting: reset the local editor
   * and flip `isPublic` back to its default for the next comment. */
  onSubmitted: () => void;
}

/**
 * Submits a new comment: reply to an existing discussion, first comment of
 * a discussion created from a `discussionId` prop, or a brand-new discussion
 * created from the draft comment mark left by text selection. Handles the
 * optimistic local state and the remapping of optimistic IDs to the
 * backend-assigned discussion ID. Kept verbatim from the original inline
 * `onAddComment` — do not change this logic when redesigning the UI around it.
 */
export function useCommentSubmit({
  discussionId,
  commentValue,
  isPublic,
  onSubmitted,
}: UseCommentSubmitOptions) {
  const discussions = usePluginOption(discussionPlugin, 'discussions');
  const callbacks = usePluginOption(discussionPlugin, 'callbacks');
  const editor = useEditorRef();

  const addComment = React.useCallback(async () => {
    if (!commentValue) return;

    const commentIsPublic = isPublic;
    onSubmitted();

    if (discussionId) {
      // Get existing discussion
      const discussion = discussions.find((d) => d.id === discussionId);
      if (!discussion) {
        // Create a new discussion (from a draft comment mark)
        const localId = nanoid();
        const currentUserId = editor.getOption(discussionPlugin, 'currentUserId');
        const newDiscussion: TDiscussion = {
          id: localId,
          comments: [
            {
              id: nanoid(),
              contentRich: commentValue,
              createdAt: new Date(),
              discussionId: localId,
              isEdited: false,
              isPublic: commentIsPublic,
              userId: currentUserId,
            },
          ],
          createdAt: new Date(),
          isResolved: false,
          userId: currentUserId,
        };

        editor.setOption(discussionPlugin, 'discussions', [
          ...discussions,
          newDiscussion,
        ]);

        // The discussionId prop points to a draft mark that has no matching
        // discussion yet — create it via the correct callback.
        await callbacks?.onCreateDiscussion?.({
          documentContent: '',
          firstCommentRich: commentValue,
          discussionId: localId,
          isPublic: commentIsPublic,
        });
        return;
      }

      // Create reply comment (optimistic)
      const comment: TComment = {
        id: nanoid(),
        contentRich: commentValue,
        createdAt: new Date(),
        discussionId,
        isEdited: false,
        isPublic: commentIsPublic,
        userId: editor.getOption(discussionPlugin, 'currentUserId'),
      };

      const updatedDiscussion = {
        ...discussion,
        comments: [...discussion.comments, comment],
      };

      const updatedDiscussions = discussions
        .filter((d) => d.id !== discussionId)
        .concat(updatedDiscussion);

      editor.setOption(discussionPlugin, 'discussions', updatedDiscussions);

      // Persist via API
      callbacks?.onAddComment?.(discussionId, commentValue, commentIsPublic);
      return;
    }

    // New discussion from a draft comment (inline text selection)
    const commentsNodeEntry = getDraftCommentEntries(editor);

    if (commentsNodeEntry.length === 0) return;

    const documentContent = draftEntriesToText(commentsNodeEntry);

    const _discussionId = nanoid();
    const currentUserId = editor.getOption(discussionPlugin, 'currentUserId');

    // Optimistic local state
    const newDiscussion: TDiscussion = {
      id: _discussionId,
      comments: [
        {
          id: nanoid(),
          contentRich: commentValue,
          createdAt: new Date(),
          discussionId: _discussionId,
          isEdited: false,
          isPublic: commentIsPublic,
          userId: currentUserId,
        },
      ],
      createdAt: new Date(),
      documentContent,
      isResolved: false,
      userId: currentUserId,
    };

    editor.setOption(discussionPlugin, 'discussions', [
      ...discussions,
      newDiscussion,
    ]);

    const id = newDiscussion.id;

    commentsNodeEntry.forEach(([, path]: [any, any]) => {
      editor.tf.setNodes(
        {
          [getCommentKey(id)]: true,
        },
        { at: path, split: true }
      );
      editor.tf.unsetNodes([getDraftCommentKey()], { at: path });
    });

    // Persist via API and await so we can sync marks with the backend-assigned ID
    const backendId = await callbacks?.onCreateDiscussion?.({
      documentContent,
      firstCommentRich: commentValue,
      discussionId: _discussionId,
      isPublic: commentIsPublic,
    });

    // If the backend assigned a different ID (its own UUID), update editor marks
    // and the local plugin state so they keep matching after query invalidation.
    if (backendId && backendId !== _discussionId) {
      const commentApi = editor.getApi(CommentPlugin).comment;
      const allNodes = [...commentApi.nodes({ at: [] })];
      allNodes.forEach(([node, path]: [any, any]) => {
        if (commentApi.nodeId(node) === _discussionId) {
          editor.tf.setNodes({ [getCommentKey(backendId)]: true }, { at: path });
          editor.tf.unsetNodes([getCommentKey(_discussionId)], { at: path });
        }
      });

      // Update the optimistic discussion entry with the real backend ID
      const current = editor.getOption(discussionPlugin, 'discussions');
      editor.setOption(
        discussionPlugin,
        'discussions',
        current.map((d: any) =>
          d.id === _discussionId
            ? {
                ...d,
                id: backendId,
                comments: d.comments.map((c: any) => ({
                  ...c,
                  discussionId: backendId,
                })),
              }
            : d
        )
      );
    }
  }, [commentValue, isPublic, discussionId, editor, discussions, callbacks, onSubmitted]);

  return { addComment };
}
