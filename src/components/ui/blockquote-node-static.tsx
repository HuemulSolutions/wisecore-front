// import * as React from 'react';

import { type SlateElementProps, SlateElement } from 'platejs/static';

export function BlockquoteElementStatic(props: SlateElementProps) {
  return (
    <SlateElement
      as="blockquote"
      className="border-l-4 border-gray-600 pl-4 italic my-4"
      {...props}
    />
  );
}
