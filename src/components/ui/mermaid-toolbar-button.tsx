'use client';

import * as React from 'react';

import { Workflow } from 'lucide-react';
import { useEditorRef } from 'platejs/react';
import { useTranslation } from 'react-i18next';

import { insertBlock } from '@/components/plate-editor/components/transforms';
import { MERMAID_KEY } from '@/lib/plate-mermaid-utils';

import { ToolbarButton } from './toolbar';

export function MermaidToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const editor = useEditorRef();
  const { t } = useTranslation('editor');

  return (
    <ToolbarButton
      {...props}
      tooltip={t('toolbar.insertMermaid')}
      onClick={() => {
        insertBlock(editor, MERMAID_KEY, { upsert: true });
        editor.tf.focus();
      }}
    >
      <Workflow />
    </ToolbarButton>
  );
}
