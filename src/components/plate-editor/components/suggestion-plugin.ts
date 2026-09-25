'use client';

import type { ExtendConfig, Path } from 'platejs';

import {
  type BaseSuggestionConfig,
  BaseSuggestionPlugin,
} from '@platejs/suggestion';
import { toTPlatePlugin } from 'platejs/react';

import { discussionPlugin } from './discussion-kit';

export type SuggestionConfig = ExtendConfig<
  BaseSuggestionConfig,
  {
    activeId: string | null;
    hoverId: string | null;
    uniquePathMap: Map<string, Path>;
  }
>;

// Separado de suggestion-kit.tsx a propósito: ese archivo importa
// SuggestionLineBreak/SuggestionLeaf desde suggestion-node.tsx, que a su vez
// necesita este plugin para usePluginOption/useEditorPlugin. Definirlo acá
// evita el import circular entre suggestion-kit.tsx y suggestion-node.tsx
// (fallaba con "Cannot access 'SuggestionLineBreak' before initialization"
// cuando el bundler evaluaba suggestion-node.tsx antes que suggestion-kit.tsx).
export const suggestionPlugin = toTPlatePlugin<SuggestionConfig>(
  BaseSuggestionPlugin,
  ({ editor }) => ({
    options: {
      activeId: null,
      currentUserId: editor.getOption(discussionPlugin, 'currentUserId'),
      hoverId: null,
      uniquePathMap: new Map(),
    },
  })
);
