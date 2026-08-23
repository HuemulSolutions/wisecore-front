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
      data-primary
      aria-label={t('toolbar.comment')}
      className="h-7 gap-1.5 rounded-lg bg-blue-600 px-2.5 font-medium text-[13px] text-white hover:bg-blue-500 hover:text-white [&_svg]:size-3.5"
    >
      <MessageSquareTextIcon />
      {t('toolbar.comment')}
    </ToolbarButton>
  );
}
