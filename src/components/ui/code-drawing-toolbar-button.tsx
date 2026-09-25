'use client';

import * as React from 'react';

import { insertCodeDrawing } from '@platejs/code-drawing';
import { PencilRuler } from 'lucide-react';
import { useEditorRef } from 'platejs/react';

import { ToolbarButton } from './toolbar';

export function CodeDrawingToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const editor = useEditorRef();

  return (
    <ToolbarButton
      {...props}
      tooltip="Code Drawing"
      onClick={() => {
        insertCodeDrawing(editor);
        editor.tf.focus();
      }}
    >
      <PencilRuler />
    </ToolbarButton>
  );
}
