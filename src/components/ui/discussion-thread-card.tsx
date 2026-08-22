'use client';

import * as React from 'react';

import type { TDiscussion } from '@/components/plate-editor/components/discussion-kit';

import { useUserPermissions } from '@/hooks/useUserPermissions';

import { CommentCreateForm } from './comment-create-form';
import { Comment } from './comment-item';
import { DiscussionThreadHeader } from './discussion-thread-header';

export interface DiscussionThreadCardProps {
  discussion: TDiscussion;
}

/** One discussion thread inside the block popover: header, comments, reply box. */
export function DiscussionThreadCard({ discussion }: DiscussionThreadCardProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const { canCreate } = useUserPermissions();
  const canCreateDiscussion = canCreate('discussion');

  return (
    <div className="group/thread">
      <DiscussionThreadHeader
        discussion={discussion}
        snippet={discussion.documentContent}
        setEditingId={setEditingId}
      />

      <div className="divide-y divide-[#eef2f7]">
        {discussion.comments.map((comment) => (
          <Comment
            key={comment.id}
            comment={comment}
            editingId={editingId}
            setEditingId={setEditingId}
          />
        ))}
      </div>

      {canCreateDiscussion && (
        <div className="border-[#eef2f7] border-t bg-[#fbfcfe] px-4 py-3">
          <CommentCreateForm discussionId={discussion.id} />
        </div>
      )}
    </div>
  );
}
