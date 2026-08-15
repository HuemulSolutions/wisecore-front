// import * as React from 'react';

import type { TMentionElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { KEYS } from 'platejs';
import { SlateElement } from 'platejs/static';

import { cn } from '@/lib/utils';

/** `refType` ausente ⇒ 'asset' (menciones creadas antes de soportar roles).
 * Ver también `WisecoreMentionElement` en mention-node.tsx. */
type WisecoreMentionElement = TMentionElement & {
  color?: string | null;
  executionId?: string | null;
  refType?: 'asset' | 'role';
};

export function MentionElementStatic(
  props: SlateElementProps<WisecoreMentionElement> & {
    prefix?: string;
  }
) {
  const { prefix } = props;
  const element = props.element;

  return (
    <SlateElement
      {...props}
      as="span"
      className={cn(
        'inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline font-medium text-sm',
        element.children[0][KEYS.bold] === true && 'font-bold',
        element.children[0][KEYS.italic] === true && 'italic',
        element.children[0][KEYS.underline] === true && 'underline'
      )}
      style={element.color ? { color: element.color } : undefined}
      attributes={{
        ...props.attributes,
        'data-slate-value': element.value,
      }}
    >
      {props.children}
      {prefix}
      {element.value}
    </SlateElement>
  );
}
