'use client';

import * as React from 'react';

import {
  type FloatingToolbarState,
  arrow,
  flip,
  offset,
  shift,
  useFloatingToolbar,
  useFloatingToolbarState,
} from '@platejs/floating';
import { KEYS } from 'platejs';
import {
  useEditorId,
  useEventEditorValue,
  usePluginOption,
} from 'platejs/react';

import { useEditorChromeInset } from '@/components/plate-editor/components/editor-chrome-inset';
import { cn } from '@/lib/utils';

import { Toolbar } from './toolbar';

const STATIC_SIDE: Record<string, string> = {
  bottom: 'top',
  left: 'right',
  right: 'left',
  top: 'bottom',
};

export function FloatingToolbar({
  children,
  className,
  state,
  ...props
}: Omit<React.ComponentProps<typeof Toolbar>, 'ref'> & {
  state?: FloatingToolbarState;
}) {
  const editorId = useEditorId();
  const focusedEditorId = useEventEditorValue('focus');
  const isFloatingLinkOpen = !!usePluginOption({ key: KEYS.link }, 'mode');
  const arrowRef = React.useRef<HTMLDivElement>(null);

  // Franja superior ocupada por el chrome fijo (header + toolbar del editor):
  // el toolbar de selección debe hacer flip hacia abajo antes que invadirla.
  const topInset = useEditorChromeInset();

  const middleware = React.useMemo(
    () => {
      const padding = { top: topInset + 12, bottom: 12, left: 12, right: 12 };

      return [
        offset(10),
        flip({
          fallbackPlacements: [
            'top-start',
            'top-end',
            'bottom-start',
            'bottom-end',
          ],
          padding,
        }),
        shift({ padding }),
        arrow({ element: arrowRef, padding: 12 }),
      ];
    },
    [topInset]
  );

  const floatingToolbarState = useFloatingToolbarState({
    editorId,
    focusedEditorId,
    hideToolbar: isFloatingLinkOpen,
    showWhenReadOnly: true,
    ...state,
    floatingOptions: {
      middleware,
      placement: 'top',
      ...state?.floatingOptions,
    },
  });

  const {
    clickOutsideRef,
    hidden,
    props: rootProps,
    ref: floatingRef,
  } = useFloatingToolbar(floatingToolbarState);

  const { middlewareData, placement } = floatingToolbarState.floating;
  const arrowX = middlewareData.arrow?.x;
  const side = placement.split('-')[0];
  const staticSide = STATIC_SIDE[side] ?? 'bottom';

  if (hidden) return null;

  return (
    <div ref={clickOutsideRef}>
      <div
        {...rootProps}
        ref={floatingRef}
        className="absolute z-(--z-editor-floating-toolbar) print:hidden"
      >
        <Toolbar
          {...props}
          className={cn(
            'scrollbar-hide flex h-10 items-center gap-1 overflow-x-auto whitespace-nowrap rounded-[10px] bg-slate-900 px-1.5 opacity-100 shadow-comment-toolbar',
            '[&_button:not([data-primary])]:text-slate-300',
            '[&_button:not([data-primary])]:hover:bg-slate-800 [&_button:not([data-primary])]:hover:text-white',
            '[&_svg]:text-current',
            'max-w-[80vw]',
            className
          )}
        >
          {children}
        </Toolbar>

        <div
          ref={arrowRef}
          aria-hidden
          className="absolute h-1.5 w-3 bg-slate-900 [clip-path:polygon(50%_100%,0_0,100%_0)]"
          style={{
            left: arrowX != null ? `${arrowX}px` : undefined,
            [staticSide]: '-6px',
            transform: side === 'bottom' ? 'rotate(180deg)' : undefined,
            visibility: arrowX == null ? 'hidden' : undefined,
          }}
        />
      </div>
    </div>
  );
}
