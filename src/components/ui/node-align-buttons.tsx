'use client';

import * as React from 'react';

import type { TElement } from 'platejs';

import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon } from 'lucide-react';
import { useEditorRef } from 'platejs/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  resolveResizableAlign,
  type ResizableAlign,
} from '@/lib/plate-node-align-utils';

const ITEMS: { value: ResizableAlign; icon: typeof AlignLeftIcon }[] = [
  { value: 'left', icon: AlignLeftIcon },
  { value: 'center', icon: AlignCenterIcon },
  { value: 'right', icon: AlignRightIcon },
];

/**
 * Left/center/right buttons for the node popover (Mermaid, code drawing…).
 * Writes `align` directly on the element, same key `TextAlignPlugin` uses,
 * so the toolbar's AlignToolbarButton and this popover stay in sync.
 */
export function NodeAlignButtons({ element }: { element: TElement }) {
  const editor = useEditorRef();
  const { t } = useTranslation('editor');
  const current = resolveResizableAlign((element as { align?: unknown }).align);

  const setAlign = React.useCallback(
    (align: ResizableAlign) => {
      const path = editor.api.findPath(element);
      if (path) {
        editor.tf.setNodes({ align }, { at: path });
      }
    },
    [editor, element]
  );

  return (
    <div className="flex items-center gap-1">
      {ITEMS.map(({ value, icon: Icon }) => (
        <Button
          key={value}
          size="icon"
          variant="ghost"
          className={cn('size-8 hover:cursor-pointer', current === value && 'bg-accent')}
          onClick={() => setAlign(value)}
          title={t(`nodeAlign.${value}`)}
        >
          <Icon className="size-4" />
        </Button>
      ))}
    </div>
  );
}
