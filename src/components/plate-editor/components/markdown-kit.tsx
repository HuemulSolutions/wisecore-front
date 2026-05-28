import { MarkdownPlugin, remarkMdx, remarkMention } from '@platejs/markdown';
import { KEYS } from 'platejs';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

/** Matches {{MEDIA:<uuid>}} tokens stored as image URLs. */
const MEDIA_TOKEN_RE = /^\{\{MEDIA:([0-9a-f-]{36})\}\}$/i;

export const MarkdownKit = [
  MarkdownPlugin.configure({
    options: {
      plainMarks: [KEYS.suggestion, KEYS.comment],
      remarkPlugins: [remarkMath, remarkGfm, remarkMdx, remarkMention],
      rules: {
        // Serialize {{MEDIA:GUID}} image nodes as raw HTML to avoid remark
        // escaping the curly braces inside the markdown image URL.
        [KEYS.img]: {
          serialize: (slateNode: any) => {
            const url: string = slateNode.url ?? '';
            if (MEDIA_TOKEN_RE.test(url)) {
              return { type: 'html', value: url } as any;
            }
            // Default: standard markdown image
            return {
              type: 'image',
              url,
              alt: slateNode.alt ?? '',
              title: slateNode.title ?? null,
            };
          },
        },
        // Deserialize raw HTML {{MEDIA:GUID}} tokens back into image nodes.
        html: {
          deserialize: (mdastNode: any) => {
            const raw: string = (mdastNode.value ?? '').trim();
            const match = MEDIA_TOKEN_RE.exec(raw);
            if (match) {
              return {
                type: KEYS.img,
                url: raw,
                mediaId: match[1],
                children: [{ text: '' }],
              };
            }
            return undefined;
          },
        },
      },
    },
  }),
];
