'use client';

import { SplitSquareHorizontal } from 'lucide-react';
import { useEditorRef } from 'platejs/react';
import { MarkdownPlugin } from '@platejs/markdown';

import { ToolbarButton } from './toolbar';

interface CreateSectionToolbarButtonProps {
  onCreateSection: (selectedMarkdown: string) => void;
}

export function CreateSectionToolbarButton({ onCreateSection }: CreateSectionToolbarButtonProps) {
  const editor = useEditorRef();

  const handleClick = () => {
    const fragment = editor.getFragment();
    if (!fragment || fragment.length === 0) return;

    const md = editor.getApi(MarkdownPlugin).markdown.serialize({ value: fragment });
    if (md.trim()) {
      onCreateSection(md.trim());
    }
  };

  return (
    <ToolbarButton
      onClick={handleClick}
      tooltip="Create section from selection"
    >
      <SplitSquareHorizontal />
    </ToolbarButton>
  );
}
