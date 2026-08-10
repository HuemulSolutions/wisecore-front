import { MarkdownPlugin, remarkMdx, remarkMention } from '@platejs/markdown';
import { KEYS } from 'platejs';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { MEDIA_TOKEN_RE, isMediaToken } from '@/lib/plate-media-utils';
import { MERMAID_KEY } from '@/lib/plate-mermaid-utils';

/** Matches `![alt]({{MEDIA:<uuid>}})` — the markdown image form of the media token. */
const MEDIA_IMAGE_RE = /^!\[([^\]]*)\]\((\{\{MEDIA:[0-9a-f-]{36}\}\})\)$/i;

/** Flattens a Plate caption/text node array (`[{ text: '...' }, ...]`) to plain text. */
function plainTextOf(nodes: unknown): string {
  if (!Array.isArray(nodes)) return '';
  return nodes
    .map((n) => (n && typeof n === 'object' && 'text' in n ? String((n as { text: unknown }).text ?? '') : ''))
    .join('')
    .trim();
}

export const MarkdownKit = [
  MarkdownPlugin.configure({
    options: {
      plainMarks: [KEYS.suggestion, KEYS.comment],
      remarkPlugins: [remarkMath, remarkGfm, remarkMdx, remarkMention],
      rules: {
        // Serialize {{MEDIA:GUID}} image nodes as a markdown image, but wrapped as raw
        // HTML so remark doesn't escape the curly braces inside the URL. The backend's
        // export_markdown only resolves the `![alt](url)` pattern, so the token must be
        // wrapped in real markdown-image syntax, not left bare.
        [KEYS.img]: {
          serialize: (slateNode: any) => {
            const url: string = slateNode.url ?? '';
            if (isMediaToken(url)) {
              return { type: 'html', value: `![${slateNode.alt ?? ''}](${url})` } as any;
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
        // A Mermaid diagram can't be rendered server-side, so the parallel markdown
        // text carries either the rasterized snapshot (once uploaded) as a standard
        // markdown image, or – if no snapshot exists yet – the source code in a fenced
        // block so the content isn't silently lost.
        [MERMAID_KEY]: {
          serialize: (slateNode: any) => {
            const url: string = slateNode.url ?? '';
            if (isMediaToken(url)) {
              const alt = plainTextOf(slateNode.caption) || 'Diagrama';
              return { type: 'html', value: `![${alt}](${url})` } as any;
            }
            const code: string = slateNode.code ?? '';
            return { type: 'html', value: '```mermaid\n' + code + '\n```' } as any;
          },
        },
        // Deserialize raw HTML {{MEDIA:GUID}} tokens back into image nodes – both the
        // bare legacy token and the `![alt]({{MEDIA:GUID}})` markdown-image form.
        html: {
          deserialize: (mdastNode: any) => {
            const raw: string = (mdastNode.value ?? '').trim();

            const imageMatch = MEDIA_IMAGE_RE.exec(raw);
            const token = imageMatch ? imageMatch[2] : raw;
            const alt = imageMatch ? imageMatch[1] : undefined;

            const match = MEDIA_TOKEN_RE.exec(token);
            if (match) {
              return {
                type: KEYS.img,
                url: token,
                mediaId: match[1],
                alt,
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
