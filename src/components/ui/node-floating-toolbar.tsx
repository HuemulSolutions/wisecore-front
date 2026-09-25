'use client';

import * as React from 'react';

import { PopoverContent } from '@/components/ui/popover';
import { useEditorChromeInset } from '@/components/plate-editor/components/editor-chrome-inset';
import { cn } from '@/lib/utils';

/**
 * Contenido de popover para los toolbars flotantes de nodo (mermaid, media,
 * tabla, …).
 *
 * Reserva como `collisionPadding.top` la franja ocupada por el chrome fijo del
 * editor, así que Radix hace flip debajo del nodo en vez de dibujarse encima
 * del toolbar fijo o del header. `hideWhenDetached` evita el toolbar huérfano
 * cuando el nodo se sale de vista al scrollear.
 *
 * Regla: ningún toolbar de nodo debe usar `PopoverContent` pelado.
 * Ver `ia context/z-index-layering-guide.md`.
 */
export function NodeFloatingToolbarContent({
  className,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof PopoverContent>) {
  const topInset = useEditorChromeInset();

  const collisionPadding = React.useMemo(
    () => ({ top: topInset + 8, bottom: 8, left: 8, right: 8 }),
    [topInset]
  );

  return (
    <PopoverContent
      side="top"
      sideOffset={sideOffset}
      avoidCollisions
      hideWhenDetached
      collisionPadding={collisionPadding}
      className={cn('z-(--z-editor-node-toolbar) w-auto p-1', className)}
      {...props}
    />
  );
}
