'use client';

// import * as React from 'react';

import type { TFileElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { useMediaState } from '@platejs/media/react';
import { ResizableProvider } from '@platejs/resizable';
import { FileUp, FileX } from 'lucide-react';
import { PlateElement, useReadOnly, withHOC } from 'platejs/react';
import { useTranslation } from 'react-i18next';

import { useResolvedMediaUrl } from '@/contexts/media-url-context';

import { Caption, CaptionTextarea } from './caption';

export const FileElement = withHOC(
  ResizableProvider,
  function FileElement(props: PlateElementProps<TFileElement>) {
    const readOnly = useReadOnly();
    const { name } = useMediaState();
    const { t } = useTranslation('editor');
    const element = props.element as TFileElement & { mediaId?: string; previewUrl?: string };
    const { src, isBroken } = useResolvedMediaUrl(element);

    return (
      <PlateElement className="my-px rounded-sm" {...props}>
        {isBroken ? (
          <div
            className="group relative m-0 flex items-center rounded px-0.5 py-[3px] text-muted-foreground"
            contentEditable={false}
          >
            <div className="flex items-center gap-1 p-1">
              <FileX className="size-5" />
              <div>{t('media.unavailable')}</div>
            </div>
          </div>
        ) : (
          <a
            className="group relative m-0 flex cursor-pointer items-center rounded px-0.5 py-[3px] hover:bg-muted"
            contentEditable={false}
            download={name}
            href={src}
            rel="noopener noreferrer"
            role="button"
            target="_blank"
          >
            <div className="flex items-center gap-1 p-1">
              <FileUp className="size-5" />
              <div>{name}</div>
            </div>

            <Caption align="left">
              <CaptionTextarea
                className="text-left"
                readOnly={readOnly}
                placeholder="Write a caption..."
              />
            </Caption>
          </a>
        )}
        {props.children}
      </PlateElement>
    );
  }
);
