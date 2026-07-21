// import * as React from 'react';

import type { TMentionElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { KEYS } from 'platejs';
import { SlateElement } from 'platejs/static';

import { cn } from '@/lib/utils';

type AssetMentionElement = TMentionElement & { color?: string | null };

export function MentionElementStatic(
  props: SlateElementProps<AssetMentionElement> & {
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
