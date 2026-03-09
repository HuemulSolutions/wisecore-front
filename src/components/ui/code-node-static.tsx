// import * as React from 'react';

import type { SlateLeafProps } from 'platejs/static';

import { SlateLeaf } from 'platejs/static';

export function CodeLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf
      {...props}
      as="code"
      className="bg-gray-800 px-1 py-0.5 rounded text-sm text-white font-mono"
    >
      {props.children}
    </SlateLeaf>
  );
}
