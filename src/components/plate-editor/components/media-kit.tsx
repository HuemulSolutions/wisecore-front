'use client';

import { CaptionPlugin } from '@platejs/caption/react';
import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  MediaEmbedPlugin,
  PlaceholderPlugin,
  VideoPlugin,
} from '@platejs/media/react';
import { KEYS } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

import { AudioElement } from '@/components/ui/media-audio-node';
import { MediaEmbedElement } from '@/components/ui/media-embed-node';
import { FileElement } from '@/components/ui/media-file-node';
import { ImageElement } from '@/components/ui/media-image-node';
import { PlaceholderElement } from '@/components/ui/media-placeholder-node';
import { MediaPreviewDialog } from '@/components/ui/media-preview-dialog';
import { MediaUploadToast } from '@/components/ui/media-upload-toast';
import { VideoElement } from '@/components/ui/media-video-node';

/**
 * Intercepts clipboard paste events that contain image files alongside text/html.
 *
 * PlaceholderPlugin only handles file pastes when text/html is NOT present:
 *   if (files.length > 0 && !types.includes("text/html")) { ... }
 *
 * When you copy an image from a browser the clipboard always contains both the
 * binary image data (files) AND an HTML snippet (<img src="url">).  Without
 * this plugin, PlaceholderPlugin skips the upload and Plate's HTML parser
 * inserts the image as a node with the raw external URL.
 *
 * Placed AFTER PlaceholderPlugin so this handler only fires once PlaceholderPlugin
 * has already returned false (i.e. declined to handle the mixed-format paste).
 */
const ImagePasteUploadPlugin = createPlatePlugin({
  key: 'image-paste-upload',
  handlers: {
    onPaste: ({ editor, event }) => {
      const clipboardData = event.clipboardData;
      if (!clipboardData) return false;

      const { files, types } = clipboardData;

      // Only handle the case PlaceholderPlugin deliberately skips:
      // image files present in the clipboard together with text/html.
      if (files.length === 0 || !types.includes('text/html')) return false;

      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (imageFiles.length === 0) return false;

      event.preventDefault();
      event.stopPropagation();

      const dt = new DataTransfer();
      imageFiles.forEach((f) => dt.items.add(f));
      editor.getTransforms(PlaceholderPlugin).insert.media(dt.files);

      return true;
    },
  },
});

export const MediaKit = [
  ImagePlugin.configure({
    options: { disableUploadInsert: true },
    render: { afterEditable: MediaPreviewDialog, node: ImageElement },
  }),
  MediaEmbedPlugin.withComponent(MediaEmbedElement),
  VideoPlugin.withComponent(VideoElement),
  AudioPlugin.withComponent(AudioElement),
  FilePlugin.withComponent(FileElement),
  PlaceholderPlugin.configure({
    options: { disableEmptyPlaceholder: true },
    render: { afterEditable: MediaUploadToast, node: PlaceholderElement },
  }),
  // Must come after PlaceholderPlugin so our onPaste handler runs after theirs
  // and only catches the mixed (files + text/html) case they skip.
  ImagePasteUploadPlugin,
  CaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.file, KEYS.mediaEmbed],
      },
    },
  }),
];
