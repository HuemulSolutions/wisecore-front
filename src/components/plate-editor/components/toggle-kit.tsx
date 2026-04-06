'use client';

import { TogglePlugin } from '@platejs/toggle/react';

import { IndentKit } from '@/components/plate-editor/components/indent-kit';
import { ToggleElement } from '@/components/ui/toggle-node';

export const ToggleKit = [
  ...IndentKit,
  TogglePlugin.withComponent(ToggleElement),
];
