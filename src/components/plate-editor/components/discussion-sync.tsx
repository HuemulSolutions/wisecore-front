'use client';

import { useEffect } from 'react';
import { useEditorRef } from 'platejs/react';

import { useDiscussions } from '@/hooks/useDiscussions';
import { discussionPlugin } from '@/components/plate-editor/components/discussion-kit';

interface DiscussionSyncProps {
  documentId: string;
}

/**
 * Invisible component that lives inside <Plate> and keeps the
 * discussion plugin state in sync with the backend API.
 *
 * Injects: discussions, users, currentUserId, and API callbacks.
 */
export function DiscussionSync({ documentId }: DiscussionSyncProps) {
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

  // Sync API callbacks
  useEffect(() => {
    editor.setOption(discussionPlugin, 'callbacks', callbacks);
  }, [editor, callbacks]);

  return null;
}
