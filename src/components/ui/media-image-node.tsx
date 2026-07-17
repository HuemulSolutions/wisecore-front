'use client';

import * as React from 'react';

import type { TImageElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { useDraggable } from '@platejs/dnd';
import { ImagePlugin, useMediaState } from '@platejs/media/react';
import { ResizableProvider, useResizableValue } from '@platejs/resizable';
import { PlateElement, withHOC } from 'platejs/react';
import { ImageOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { useResolvedMediaUrl } from '@/contexts/media-url-context';

import { Caption, CaptionTextarea } from './caption';
import { MediaToolbar } from './media-toolbar';
import {
  mediaResizeHandleVariants,
  Resizable,
  ResizeHandle,
} from './resize-handle';

export const ImageElement = withHOC(
  ResizableProvider,
  function ImageElement(props: PlateElementProps<TImageElement>) {
    const { align = 'center', focused, readOnly, selected } = useMediaState();
    const width = useResizableValue('width');
    const element = props.element as TImageElement & { mediaId?: string; previewUrl?: string };
    const { t } = useTranslation('editor');

    const { isDragging, handleRef } = useDraggable({
      element: props.element,
    });

    // Resolve the freshest URL available: the live /media_urls map (by mediaId)
    // when present, else the node's own url/previewUrl. See useResolvedMediaUrl
    // for why previewUrl is only trusted while url is still an unresolved token.
    const { src, isBroken } = useResolvedMediaUrl(element);
    const [loadError, setLoadError] = React.useState(false);
    // Clear a stale broken flag once the src actually changes (e.g. after a
    // /media_urls refresh replaces an expired SAS url with a fresh one).
    React.useEffect(() => setLoadError(false), [src]);
    const showBroken = isBroken || loadError;

    return (
      <MediaToolbar plugin={ImagePlugin}>
        <PlateElement {...props} className="py-2.5">
          <figure className="group relative m-0" contentEditable={false}>
            <Resizable
              align={align}
              options={{
                align,
                readOnly,
              }}
            >
              <ResizeHandle
                className={mediaResizeHandleVariants({ direction: 'left' })}
                options={{ direction: 'left' }}
              />
              {showBroken ? (
                <div
                  ref={handleRef}
                  className={cn(
                    'flex w-full max-w-full items-center justify-center gap-2 rounded-sm bg-muted py-8 text-muted-foreground',
                    focused && selected && 'ring-2 ring-ring ring-offset-2'
                  )}
                >
                  <ImageOff className="size-5" />
                  <span className="text-sm">{t('media.unavailable')}</span>
                </div>
              ) : (
                <img
                  ref={handleRef}
                  src={src}
                  onError={() => setLoadError(true)}
                  className={cn(
                    'block w-full max-w-full cursor-pointer object-cover px-0',
                    'rounded-sm',
                    focused && selected && 'ring-2 ring-ring ring-offset-2',
                    isDragging && 'opacity-50'
                  )}
                  alt={props.attributes.alt as string | undefined}
                />
              )}
              <ResizeHandle
                className={mediaResizeHandleVariants({
                  direction: 'right',
                })}
                options={{ direction: 'right' }}
              />
            </Resizable>

            <Caption style={{ width }} align={align}>
              <CaptionTextarea
                readOnly={readOnly}
                onFocus={(e) => {
                  e.preventDefault();
                }}
                placeholder="Write a caption..."
              />
            </Caption>
          </figure>

          {props.children}
        </PlateElement>
      </MediaToolbar>
    );
  }
);
