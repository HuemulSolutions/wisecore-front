'use client';

import { useEffect, useMemo } from 'react';
import { useEditorRef } from 'platejs/react';

import { useDiscussions } from '@/hooks/useDiscussions';
import { discussionPlugin } from '@/components/plate-editor/components/discussion-kit';
import type { DiscussionCallbacks } from '@/components/plate-editor/components/discussion-kit';

interface DiscussionSyncProps {
  documentId: string;
  /**
   * Called after any discussion mutation (create discussion, add comment).
   * Use this to auto-save plate_content so comment marks are persisted.
   */
  onAfterDiscussionMutation?: () => void;
}

/**
 * Invisible component that lives inside <Plate> and keeps the
 * discussion plugin state in sync with the backend API.
 *
 * Injects: discussions, users, currentUserId, and API callbacks.
 */
export function DiscussionSync({ documentId, onAfterDiscussionMutation }: DiscussionSyncProps) {
  const editor = useEditorRef();
  const {
    discussions,
    usersMap,
    currentUserId,
    callbacks,
  } = useDiscussions(documentId);

  // Sync discussions list
  useEffect(() => {
    editor.setOption(discussionPlugin, 'discussions', discussions);
  }, [editor, discussions]);

  // Sync users map
  useEffect(() => {
    editor.setOption(discussionPlugin, 'users', usersMap);
  }, [editor, usersMap]);

  // Sync current user
  useEffect(() => {
    if (currentUserId) {
      editor.setOption(discussionPlugin, 'currentUserId', currentUserId);
    }
  }, [editor, currentUserId]);

  // Wrap callbacks to trigger plate_content auto-save after any discussion mutation.
  // This ensures comment marks are persisted even when the user never clicks Save.
  const wrappedCallbacks = useMemo<DiscussionCallbacks>(() => {
    if (!onAfterDiscussionMutation) return callbacks;
    return {
      ...callbacks,
      onCreateDiscussion: async (data) => {
        const id = await callbacks.onCreateDiscussion?.(data);
        // Schedule auto-save AFTER returning the backend ID so the caller
        // (comment.tsx) can remap marks from the temporary nanoid to the
        // backend UUID before we persist plate_content.
        setTimeout(() => onAfterDiscussionMutation(), 0);
        return id;
      },
      onAddComment: async (discussionId, contentRich) => {
        const id = await callbacks.onAddComment?.(discussionId, contentRich);
        onAfterDiscussionMutation();
        return id;
      },
    };
  }, [callbacks, onAfterDiscussionMutation]);

  // Sync API callbacks
  useEffect(() => {
    editor.setOption(discussionPlugin, 'callbacks', wrappedCallbacks);
  }, [editor, wrappedCallbacks]);

  return null;
}
