'use client';

import * as React from 'react';

import type { Value } from 'platejs';

import { useTranslation } from 'react-i18next';
import { Plate, useEditorRef, usePluginOption } from 'platejs/react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatCommentDate, formatCommentDateAbsolute } from '@/lib/comment-utils';
import { discussionPlugin } from '@/components/plate-editor/components/discussion-kit';

import { CommentEditActions } from './comment-edit-actions';
import { CommentMoreDropdown } from './comment-more-dropdown';
import { Editor, EditorContainer } from './editor';
import { useCommentEditor } from './useCommentEditor';

export type TComment = {
  id: string;
  contentRich: Value;
  createdAt: Date;
  discussionId: string;
  isEdited: boolean;
  isPublic: boolean;
  userId: string;
};

export interface CommentItemProps {
  comment: TComment;
  editingId: string | null;
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
  onEditorClick?: () => void;
}

/** A single comment row inside a discussion thread card. Rows are separated
 * by the parent's `divide-y` — this component draws no connecting lines. */
export function Comment(props: CommentItemProps) {
  const { comment, editingId, setEditingId, onEditorClick } = props;

  const { t } = useTranslation('editor');
  const editor = useEditorRef();
  const userInfo = usePluginOption(discussionPlugin, 'user', comment.userId);
  const currentUserId = usePluginOption(discussionPlugin, 'currentUserId');
  const callbacks = usePluginOption(discussionPlugin, 'callbacks');

  const updateComment = async (input: {
    id: string;
    contentRich: Value;
    discussionId: string;
    isPublic: boolean;
  }) => {
    // Optimistic local update
    const updatedDiscussions = editor
      .getOption(discussionPlugin, 'discussions')
      .map((discussion) => {
        if (discussion.id === input.discussionId) {
          const updatedComments = discussion.comments.map((c) => {
            if (c.id === input.id) {
              return {
                ...c,
                contentRich: input.contentRich,
                isEdited: true,
                isPublic: input.isPublic,
              };
            }
            return c;
          });
          return { ...discussion, comments: updatedComments };
        }
        return discussion;
      });
    editor.setOption(discussionPlugin, 'discussions', updatedDiscussions);
    // Persist via API
    await callbacks?.onUpdateComment?.(
      input.id,
      input.contentRich,
      input.discussionId,
      input.isPublic
    );
  };

  const isMyComment = currentUserId === comment.userId;
  const initialValue = comment.contentRich;

  const commentEditor = useCommentEditor(
    { id: comment.id, value: initialValue },
    [initialValue]
  );

  const [editIsPublic, setEditIsPublic] = React.useState(comment.isPublic);

  const onCancel = () => {
    setEditingId(null);
    setEditIsPublic(comment.isPublic);
    commentEditor.tf.replaceNodes(initialValue, {
      at: [],
      children: true,
    });
  };

  const onSave = () => {
    void updateComment({
      id: comment.id,
      contentRich: commentEditor.children,
      discussionId: comment.discussionId,
      isPublic: editIsPublic,
    });
    setEditingId(null);
  };

  const isEditing = !!editingId && editingId === comment.id;

  const [hovering, setHovering] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <div
      className="px-4 py-3"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="relative flex items-center gap-2">
        <Avatar className="size-[26px] shrink-0">
          <AvatarImage alt={userInfo?.name} src={userInfo?.avatarUrl} />
          <AvatarFallback>{userInfo?.name?.[0]}</AvatarFallback>
        </Avatar>

        <span className="font-semibold text-[13.5px] text-slate-900 leading-none">
          {userInfo?.name}
        </span>

        <span
          className="text-[11.5px] text-slate-400 leading-none"
          title={formatCommentDateAbsolute(comment.createdAt)}
        >
          {formatCommentDate(comment.createdAt)}
          {comment.isEdited && (
            <span className="ml-1">· {t('discussion.edited')}</span>
          )}
        </span>

        {comment.isPublic === false && (
          <Badge
            variant="outline"
            className="border-[#fadfb8] bg-[#fef3e2] px-1.5 py-0 font-semibold text-[10px] text-amber-700"
          >
            {t('discussion.privateBadge')}
          </Badge>
        )}

        {isMyComment && (hovering || dropdownOpen) && !isEditing && (
          <div className="ml-auto flex shrink-0">
            <CommentMoreDropdown
              onCloseAutoFocus={() => {
                setTimeout(() => {
                  commentEditor.tf.focus({ edge: 'endEditor' });
                }, 0);
              }}
              comment={comment}
              dropdownOpen={dropdownOpen}
              setDropdownOpen={setDropdownOpen}
              setEditingId={setEditingId}
            />
          </div>
        )}
      </div>

      <div className="relative mt-1 pl-[34px]">
        <Plate readOnly={!isEditing} editor={commentEditor}>
          <EditorContainer variant="comment">
            <Editor
              variant="comment"
              className="w-auto grow text-[13.5px] text-slate-800 leading-[1.55]"
              onClick={() => onEditorClick?.()}
            />

            {isEditing && (
              <CommentEditActions
                isPublic={editIsPublic}
                onToggleVisibility={() => setEditIsPublic((prev) => !prev)}
                onCancel={onCancel}
                onSave={onSave}
              />
            )}
          </EditorContainer>
        </Plate>
      </div>
    </div>
  );
}
