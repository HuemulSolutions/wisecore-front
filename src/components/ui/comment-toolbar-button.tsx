'use client';

// import * as React from 'react';

import { MessageSquareTextIcon } from 'lucide-react';
import { useEditorRef } from 'platejs/react';
import { useTranslation } from 'react-i18next';

import { commentPlugin } from '@/components/plate-editor/components/comment-kit';

import { ToolbarButton } from './toolbar';

export function CommentToolbarButton() {
  const editor = useEditorRef();
  const { t } = useTranslation('editor');

  return (
    <ToolbarButton
      onClick={() => {
        editor.getTransforms(commentPlugin).comment.setDraft();
      }}
      data-plate-prevent-overlay
      tooltip={t('toolbar.comment')}
    >
      <MessageSquareTextIcon />
    </ToolbarButton>
  );
}
