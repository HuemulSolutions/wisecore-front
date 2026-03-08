'use client';

// import * as React from 'react';

import type { PlateLeafProps } from 'platejs/react';

import { PlateLeaf } from 'platejs/react';

export function HighlightLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf {...props} as="mark" className="rounded-md bg-amber-200 px-1 py-0.5 text-amber-950 ring-1 ring-amber-400/60">
      {props.children}
    </PlateLeaf>
  );
}
