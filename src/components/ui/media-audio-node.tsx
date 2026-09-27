'use client';

// import * as React from 'react';

import type { TAudioElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { useMediaState } from '@platejs/media/react';
import { ResizableProvider } from '@platejs/resizable';
import { PlateElement, withHOC } from 'platejs/react';
import { FileX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useResolvedMediaUrl } from '@/contexts/media-url-context';

import { Caption, CaptionTextarea } from './caption';

export const AudioElement = withHOC(
  ResizableProvider,
  function AudioElement(props: PlateElementProps<TAudioElement>) {
    const { align = 'center', readOnly } = useMediaState();
    const { t } = useTranslation('editor');
    const element = props.element as TAudioElement & { mediaId?: string; previewUrl?: string };
    const { src, isBroken } = useResolvedMediaUrl(element);

    return (
      <PlateElement {...props} className="mb-1">
        <figure
          className="group relative cursor-default"
          contentEditable={false}
        >
          <div className="h-16">
            {isBroken ? (
              <div className="flex h-full items-center gap-2 rounded-sm bg-muted px-3 text-muted-foreground">
                <FileX className="size-4" />
                <span className="text-sm">{t('media.unavailable')}</span>
              </div>
            ) : (
              <audio className="size-full" src={src} controls />
            )}
          </div>

          <Caption style={{ width: '100%' }} align={align}>
            <CaptionTextarea
              className="h-20"
              readOnly={readOnly}
              placeholder="Write a caption..."
            />
          </Caption>
        </figure>
        {props.children}
      </PlateElement>
    );
  }
);
