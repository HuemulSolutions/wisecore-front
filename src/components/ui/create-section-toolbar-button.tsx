'use client';

import { SplitSquareHorizontal } from 'lucide-react';
import { useEditorRef } from 'platejs/react';
import { useTranslation } from 'react-i18next';
import { MarkdownPlugin } from '@platejs/markdown';

import { ToolbarButton } from './toolbar';

interface CreateSectionToolbarButtonProps {
  onCreateSection: (selectedMarkdown: string) => void;
}

export function CreateSectionToolbarButton({ onCreateSection }: CreateSectionToolbarButtonProps) {
  const editor = useEditorRef();
  const { t } = useTranslation('editor');

  const handleClick = () => {
    const fragment = (editor as any).getFragment();
    if (!fragment || fragment.length === 0) return;

    const md = editor.getApi(MarkdownPlugin).markdown.serialize({ value: fragment });
    if (md.trim()) {
      onCreateSection(md.trim());
    }
  };

  return (
    <ToolbarButton
      onClick={handleClick}
      tooltip={t('toolbar.createSectionFromSelection')}
    >
      <SplitSquareHorizontal />
    </ToolbarButton>
  );
}
