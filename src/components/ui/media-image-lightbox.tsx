'use client';

import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

/**
 * Fullscreen image viewer for a media-reference image node. Renders the already
 * resolved `src` (see `useResolvedMediaUrl`) — never the raw `{{MEDIA:<uuid>}}`
 * token, unlike `@platejs/media`'s own `openImagePreview`, which reads
 * `element.url` directly and would show a broken image for our tokenized nodes.
 * Layout mirrors the lightbox already used in `huemul-media-preview-pane.tsx`.
 */
export function MediaImageLightbox({
  open,
  onOpenChange,
  src,
  alt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt?: string;
}) {
  const { t } = useTranslation('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-0 left-0 flex h-screen w-screen max-w-none translate-x-0 translate-y-0 items-center justify-center gap-0 rounded-none border-0 bg-black/95 p-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">{alt || ''}</DialogTitle>
        <img src={src} alt={alt} className="max-h-[95vh] max-w-[95vw] object-contain" />
        <button
          type="button"
          aria-label={t('close')}
          onClick={() => onOpenChange(false)}
          className="fixed top-4 right-4 rounded-full bg-black/50 p-2 text-white transition-opacity hover:opacity-80"
        >
          <X className="size-5" />
        </button>
      </DialogContent>
    </Dialog>
  );
}
