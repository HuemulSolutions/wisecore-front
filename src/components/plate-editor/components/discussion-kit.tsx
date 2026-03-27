'use client';

import type { Value } from 'platejs';

import type { TComment } from '@/components/ui/comment';

import { createPlatePlugin } from 'platejs/react';

import { BlockDiscussion } from '@/components/ui/block-discussion';

export type TDiscussion = {
  id: string;
  comments: TComment[];
  createdAt: Date;
  isResolved: boolean;
  userId: string;
  documentContent?: string;
};

export type TDiscussionUser = {
  id: string;
  name: string;
  avatarUrl: string;
};

// Callback types for API-backed CRUD operations
export type DiscussionCallbacks = {
  onCreateDiscussion?: (data: {
    documentContent: string;
    firstCommentRich: Value;
    discussionId: string;
  }) => Promise<string | undefined>;
  onResolveDiscussion?: (discussionId: string) => Promise<void>;
  onDeleteDiscussion?: (discussionId: string) => Promise<void>;
  onAddComment?: (
    discussionId: string,
    contentRich: Value,
  ) => Promise<string | undefined>;
  onUpdateComment?: (
    commentId: string,
    contentRich: Value,
    discussionId: string,
  ) => Promise<void>;
  onDeleteComment?: (
    commentId: string,
    discussionId: string,
  ) => Promise<void>;
};

// This plugin stores discussions, users, and optional API callbacks.
// Data is synced from the backend via DiscussionSync (inside <Plate>).
export const discussionPlugin = createPlatePlugin({
  key: 'discussion',
  options: {
    currentUserId: '' as string,
    discussions: [] as TDiscussion[],
    users: {} as Record<string, TDiscussionUser>,
    callbacks: {} as DiscussionCallbacks,
  },
})
  .configure({
    render: { aboveNodes: BlockDiscussion },
  })
  .extendSelectors(({ getOption }) => ({
    currentUser: () => getOption('users')[getOption('currentUserId')],
    user: (id: string) => getOption('users')[id],
  }));

export const DiscussionKit = [discussionPlugin];
