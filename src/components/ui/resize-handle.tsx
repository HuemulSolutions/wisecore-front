'use client';

import * as React from 'react';

import type { VariantProps } from 'class-variance-authority';

import {
  type ResizeHandle as ResizeHandlePrimitive,
  Resizable as ResizablePrimitive,
  useResizeHandle,
  useResizeHandleState,
} from '@platejs/resizable';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const mediaResizeHandleVariants = cva(
  cn(
    'top-0 flex w-6 select-none flex-col justify-center',
    "after:flex after:h-16 after:w-[3px] after:rounded-[6px] after:bg-ring after:opacity-0 after:content-['_'] group-hover:after:opacity-100"
  ),
  {
    variants: {
      direction: {
        left: '-left-3 -ml-3 pl-3',
        right: '-right-3 -mr-3 items-end pr-3',
      },
    },
  }
);

/**
 * Barra horizontal centrada en el borde inferior. Complemento vertical de
 * mediaResizeHandleVariants: mismo offset de 12px y misma mecánica de aparición
 * (necesita un ancestro con la clase `group`).
 */
export const mediaResizeHandleBottomVariants = cva(
  cn(
    '-bottom-3 left-0 -mb-3 flex h-6 w-full select-none items-center justify-center pb-3',
    "after:h-[3px] after:w-16 after:rounded-[6px] after:bg-ring after:opacity-0 after:content-['_'] group-hover:after:opacity-100"
  )
);

/** Escuadra de redimensionado en la esquina inferior derecha. */
export const mediaResizeHandleCornerVariants = cva(
  cn(
    'right-0 bottom-0 flex h-6 w-6 cursor-nwse-resize select-none items-end justify-end p-1',
    "after:size-2.5 after:rounded-[2px] after:border-r-2 after:border-b-2 after:border-ring after:opacity-0 after:content-['_'] group-hover:after:opacity-100"
  )
);

const resizeHandleVariants = cva('absolute z-40', {
  variants: {
    direction: {
      bottom: 'w-full cursor-row-resize',
      left: 'h-full cursor-col-resize',
      right: 'h-full cursor-col-resize',
      top: 'w-full cursor-row-resize',
    },
  },
});

export function ResizeHandle({
  className,
  options,
  ...props
}: React.ComponentProps<typeof ResizeHandlePrimitive> &
  VariantProps<typeof resizeHandleVariants>) {
  const state = useResizeHandleState(options ?? {});
  const resizeHandle = useResizeHandle(state);

  if (state.readOnly) return null;

  return (
    <div
      className={cn(
        resizeHandleVariants({ direction: options?.direction }),
        className
      )}
      data-resizing={state.isResizing}
      {...resizeHandle.props}
      {...props}
    />
  );
}

const resizableVariants = cva('', {
  variants: {
    align: {
      center: 'mx-auto',
      left: 'mr-auto',
      right: 'ml-auto',
    },
  },
});

export function Resizable({
  align,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive> &
  VariantProps<typeof resizableVariants>) {
  return (
    <ResizablePrimitive
      {...props}
      className={cn(resizableVariants({ align }), className)}
    />
  );
}
