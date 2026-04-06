// import * as React from 'react';

import type { SlateLeafProps } from 'platejs/static';

import { SlateLeaf } from 'platejs/static';

export function HighlightLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props} as="mark" className="rounded-md bg-amber-200 px-1 py-0.5 text-amber-950 ring-1 ring-amber-400/60">
      {props.children}
    </SlateLeaf>
  );
}
