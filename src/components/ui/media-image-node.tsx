'use client';

import type { TImageElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { useDraggable } from '@platejs/dnd';
import { ImagePlugin, useMediaState } from '@platejs/media/react';
import { ResizableProvider, useResizableValue } from '@platejs/resizable';
import { PlateElement, withHOC } from 'platejs/react';

import { useOrganization } from '@/contexts/organization-context';
import { useMediaDownloadUrl } from '@/hooks/useMedia';
import { cn } from '@/lib/utils';

import { Caption, CaptionTextarea } from './caption';
import { MediaToolbar } from './media-toolbar';
import {
  mediaResizeHandleVariants,
  Resizable,
  ResizeHandle,
} from './resize-handle';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Try to extract a media ID from an Azure Blob Storage SAS URL.
 * Blob paths look like: /container-name/{uuid}.ext
 */
function extractMediaIdFromBlobUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('.blob.core.windows.net')) return undefined;
    const segments = parsed.pathname.split('/');
    const blobName = segments[segments.length - 1]; // e.g. "uuid.png"
    const uuidPart = blobName.replace(/\.[^.]+$/, ''); // strip extension
    return UUID_RE.test(uuidPart) ? uuidPart : undefined;
  } catch {
    return undefined;
  }
}

export const ImageElement = withHOC(
  ResizableProvider,
  function ImageElement(props: PlateElementProps<TImageElement>) {
    const { align = 'center', focused, readOnly, selected } = useMediaState();
    const width = useResizableValue('width');
    const element = props.element as TImageElement & { mediaId?: string };

    const { isDragging, handleRef } = useDraggable({
      element: props.element,
    });

    const { selectedOrganizationId } = useOrganization();

    // Prefer explicit mediaId; fall back to extracting from blob URL
    const resolvedMediaId = element.mediaId ?? extractMediaIdFromBlobUrl(element.url);

    const { data: freshUrl } = useMediaDownloadUrl(
      selectedOrganizationId ?? '',
      resolvedMediaId ?? '',
    );

    // Use the fresh backend URL when available; otherwise fall back to element.url
    const displayUrl = resolvedMediaId && freshUrl ? freshUrl : element.url;

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
              <img
                ref={handleRef}
                src={displayUrl}
                className={cn(
                  'block w-full max-w-full cursor-pointer object-cover px-0',
                  'rounded-sm',
                  focused && selected && 'ring-2 ring-ring ring-offset-2',
                  isDragging && 'opacity-50'
                )}
                alt={props.attributes.alt as string | undefined}
              />
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
