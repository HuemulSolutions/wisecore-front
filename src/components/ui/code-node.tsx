'use client';

// import * as React from 'react';

import type { PlateLeafProps } from 'platejs/react';

import { PlateLeaf } from 'platejs/react';

export function CodeLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf
      {...props}
      as="code"
      className="bg-gray-800 px-1 py-0.5 rounded text-sm text-white font-mono"
    >
      {props.children}
    </PlateLeaf>
  );
}
