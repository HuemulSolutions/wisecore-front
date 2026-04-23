'use client';

import { BaseCodeDrawingPlugin } from '@platejs/code-drawing';

import { CodeDrawingElementStatic } from '@/components/ui/code-drawing-node-static';

export const BaseCodeDrawingKit = [
  BaseCodeDrawingPlugin.withComponent(CodeDrawingElementStatic),
];
