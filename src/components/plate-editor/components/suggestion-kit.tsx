'use client';

import { isSlateEditor, isSlateString } from 'platejs';

import {
  SuggestionLeaf,
  SuggestionLineBreak,
} from '@/components/ui/suggestion-node';

import { suggestionPlugin as baseSuggestionPlugin } from './suggestion-plugin';

export type { SuggestionConfig } from './suggestion-plugin';

export const suggestionPlugin = baseSuggestionPlugin.configure({
  handlers: {
    // unset active suggestion when clicking outside of suggestion
    onClick: ({ api, event, setOption, type }) => {
      let leaf = event.target as HTMLElement;
      let isSet = false;

      const isBlockLeaf = leaf.dataset.blockSuggestion === 'true';

      const unsetActiveSuggestion = () => {
        setOption('activeId', null);
        isSet = true;
      };

      if (!isSlateString(leaf) && !isBlockLeaf) {
        unsetActiveSuggestion();
      }

      while (leaf.parentElement && !isSlateEditor(leaf.parentElement)) {
        const isBlockSuggestion = leaf.dataset.blockSuggestion === 'true';

        if (leaf.classList.contains(`slate-${type}`) || isBlockSuggestion) {
          const suggestionEntry = api.suggestion!.node({
            isText: !isBlockSuggestion,
          });

          if (!suggestionEntry) {
            unsetActiveSuggestion();

            break;
          }

          const id = api.suggestion!.nodeId(suggestionEntry[0]);
          setOption('activeId', id ?? null);

          isSet = true;

          break;
        }

        leaf = leaf.parentElement;
      }

      if (!isSet) unsetActiveSuggestion();
    },
  },
  render: {
    belowNodes: SuggestionLineBreak as any,
    node: SuggestionLeaf,
  },
});

export const SuggestionKit = [suggestionPlugin];
