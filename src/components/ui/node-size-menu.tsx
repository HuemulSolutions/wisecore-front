'use client';

import * as React from 'react';

import type { TElement } from 'platejs';

import { Scaling } from 'lucide-react';
import { useEditorRef } from 'platejs/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PERCENT_PRESETS = [25, 50, 75, 100] as const;

type SizableElement = TElement & { width?: string | number };

/**
 * Width presets for a resizable node (Mermaid, code drawing…) – the quick
 * "make it bigger/smaller" complement to dragging the side handles. Values are
 * written to `element.width`, the same key `Resizable` (@platejs/resizable)
 * already persists when the handles are dragged.
 */
export function NodeSizeMenu({
  element,
  intrinsicWidth,
}: {
  element: SizableElement;
  intrinsicWidth?: number;
}) {
  const editor = useEditorRef();
  const { t } = useTranslation('editor');
  const [open, setOpen] = React.useState(false);

  const currentWidth = element.width ?? '100%';
  const currentValue =
    typeof currentWidth === 'number' ? `${currentWidth}px` : String(currentWidth);
  const originalValue = intrinsicWidth ? `${Math.round(intrinsicWidth)}px` : undefined;

  const setWidth = React.useCallback(
    (width: string) => {
      const path = editor.api.findPath(element);
      if (path) {
        editor.tf.setNodes({ width }, { at: path });
      }
    },
    [editor, element]
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 hover:cursor-pointer"
          title={t('nodeSize.label')}
        >
          <Scaling className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup value={currentValue} onValueChange={setWidth}>
          {PERCENT_PRESETS.map((percent) => (
            <DropdownMenuRadioItem key={percent} value={`${percent}%`}>
              {percent}%
            </DropdownMenuRadioItem>
          ))}
          {originalValue && (
            <DropdownMenuRadioItem value={originalValue}>
              {t('nodeSize.original')}
            </DropdownMenuRadioItem>
          )}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
