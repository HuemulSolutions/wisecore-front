'use client';

// Compatibility barrel — the comment UI now lives in `comment-item.tsx` and
// `comment-create-form.tsx`. New code should import those directly; this
// file exists only so the existing importers (block-discussion.tsx,
// block-suggestion.tsx, discussion-kit.tsx, useDiscussions.ts) keep working.
export type { TComment } from './comment-item';
export { Comment } from './comment-item';
export { CommentCreateForm } from './comment-create-form';
