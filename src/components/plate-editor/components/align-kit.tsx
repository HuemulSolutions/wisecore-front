'use client';

import { TextAlignPlugin } from '@platejs/basic-styles/react';
import { CODE_DRAWING_KEY } from '@platejs/code-drawing';
import { KEYS } from 'platejs';

import { MERMAID_KEY } from '@/lib/plate-mermaid-utils';

export const AlignKit = [
  TextAlignPlugin.configure({
    inject: {
      nodeProps: {
        defaultNodeValue: 'start',
        nodeKey: 'align',
        styleKey: 'textAlign',
        validNodeValues: ['start', 'left', 'center', 'right', 'end', 'justify'],
      },
      targetPlugins: [
        ...KEYS.heading,
        KEYS.p,
        KEYS.img,
        KEYS.mediaEmbed,
        MERMAID_KEY,
        CODE_DRAWING_KEY,
      ],
    },
  }),
];
