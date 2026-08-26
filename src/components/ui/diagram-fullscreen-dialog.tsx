'use client';

import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Near-fullscreen viewer for a diagram (Mermaid SVG markup or a rasterized code
 * drawing image) – lets the reader inspect a dense diagram at full size regardless
 * of how small it's set to render inline in the document.
 */
export function DiagramFullscreenDialog({
  open,
  onOpenChange,
  svg,
  imageSrc,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  svg?: string;
  imageSrc?: string;
  title?: string;
}) {
  const { t } = useTranslation('editor');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] max-w-[95vw] flex-col items-stretch sm:max-w-[95vw]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">
          {title || t('fullscreen.title')}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {t('fullscreen.description')}
        </DialogDescription>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-2">
          {svg ? (
            <div
              className="max-h-full max-w-full [&_svg]:max-h-[85vh] [&_svg]:max-w-full [&_svg]:object-contain"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : imageSrc ? (
            <img
              src={imageSrc}
              alt={title || t('fullscreen.title')}
              className="max-h-[85vh] max-w-full object-contain"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
