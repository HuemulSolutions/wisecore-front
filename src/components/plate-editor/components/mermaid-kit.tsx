'use client';

import { createPlatePlugin } from 'platejs/react';

import { MermaidElement } from '@/components/ui/mermaid-node';
import { MERMAID_KEY } from '@/lib/plate-mermaid-utils';

const MermaidPlugin = createPlatePlugin({
  key: MERMAID_KEY,
  node: { isElement: true, isVoid: true },
}).withComponent(MermaidElement);

export const MermaidKit = [MermaidPlugin];
