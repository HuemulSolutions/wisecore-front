'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { useMediaState } from '@platejs/media/react';
import { ResizableProvider } from '@platejs/resizable';
import { Download, FileX } from 'lucide-react';
import { PlateElement, useReadOnly, withHOC } from 'platejs/react';
import { useTranslation } from 'react-i18next';

import { formatBytes } from '@/lib/format-bytes';
import { useResolvedMediaUrl } from '@/contexts/media-url-context';
import { contentTypeFromFilename, MediaIcon } from '@/huemul/components/huemul-media-icon';
import type { MediaFileElement } from '@/types/media-node';

import { Caption, CaptionTextarea } from './caption';

export const FileElement = withHOC(
  ResizableProvider,
  function FileElement(props: PlateElementProps<MediaFileElement>) {
    const readOnly = useReadOnly();
    const { name } = useMediaState();
    const { t } = useTranslation('editor');
    const element = props.element;
    const { src, isBroken } = useResolvedMediaUrl(element);
    const contentType = element.contentType ?? contentTypeFromFilename(name);
    const subtitle = [contentType?.split('/')[1], element.fileSize != null ? formatBytes(element.fileSize) : null]
      .filter(Boolean)
      .join(' · ');

    function openFile(e: React.SyntheticEvent) {
      e.preventDefault();
      e.stopPropagation();
      if (!src) return;
      window.open(src, '_blank', 'noopener,noreferrer');
    }

    function downloadFile(e: React.SyntheticEvent) {
      e.preventDefault();
      e.stopPropagation();
      if (!src) return;
      const a = document.createElement('a');
      a.href = src;
      a.download = name || '';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    }

    return (
      <PlateElement className="my-1.5 rounded-sm" {...props}>
        {isBroken ? (
          <div
            className="group relative m-0 flex items-center gap-2 rounded-lg border bg-muted/40 px-2.5 py-2 text-muted-foreground"
            contentEditable={false}
          >
            <FileX className="size-5 shrink-0" />
            <div className="text-sm">{t('media.unavailable')}</div>
          </div>
        ) : (
          <div
            className="group relative m-0 flex cursor-pointer items-center gap-2.5 rounded-lg border bg-card px-2.5 py-2 hover:bg-muted/60"
            contentEditable={false}
            role="button"
            tabIndex={0}
            aria-label={t('media.openInNewTab')}
            onClick={openFile}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') openFile(e);
            }}
          >
            <MediaIcon contentType={contentType} className="size-6 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{name || t('media.untitledFile')}</div>
              {subtitle && <div className="truncate text-xs text-muted-foreground">{subtitle}</div>}
            </div>
            <button
              type="button"
              className="ml-auto shrink-0 rounded p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground group-hover:opacity-100"
              aria-label={t('media.downloadFile')}
              title={t('media.downloadFile')}
              onClick={downloadFile}
            >
              <Download className="size-4" />
            </button>
          </div>
        )}

        {/* Caption stays outside the clickable card so editing it never opens the file. */}
        <Caption align="left">
          <CaptionTextarea
            readOnly={readOnly}
            placeholder="Write a caption..."
          />
        </Caption>

        {props.children}
      </PlateElement>
    );
  }
);
