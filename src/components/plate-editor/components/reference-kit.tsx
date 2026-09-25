'use client';

import { createPlatePlugin } from 'platejs/react';

import { AssetReferenceNode } from '@/components/ui/asset-reference-node';
import { RoleReferenceNode } from '@/components/ui/role-reference-node';
import { ASSET_REFERENCE_KEY, ROLE_REFERENCE_KEY } from '@/lib/plate-reference-utils';

/**
 * Los dos nodos inline void insertados por el combobox de mención `@`
 * (`reference-combobox-input.tsx`), mismo molde que `MermaidPlugin` en
 * mermaid-kit.tsx. El trigger/input (`@` abre el combobox) sigue viviendo en
 * `MentionPlugin`/`MentionInputPlugin` de `@platejs/mention` — ver mention-kit.tsx.
 */
const AssetReferencePlugin = createPlatePlugin({
  key: ASSET_REFERENCE_KEY,
  node: { isElement: true, isInline: true, isVoid: true },
}).withComponent(AssetReferenceNode);

const RoleReferencePlugin = createPlatePlugin({
  key: ROLE_REFERENCE_KEY,
  node: { isElement: true, isInline: true, isVoid: true },
}).withComponent(RoleReferenceNode);

export const ReferenceKit = [AssetReferencePlugin, RoleReferencePlugin];
