import { KEYS } from 'platejs';

import { ASSET_REFERENCE_KEY, ROLE_REFERENCE_KEY } from '@/lib/plate-reference-utils';

/**
 * Recursively collect the asset ids referenced in a Plate JSON tree — both the
 * legacy `mention` node (`key`, skipping role mentions via `refType === 'role'`)
 * and the current `asset_reference` node (`assetId`). Used to resolve all "chips"
 * of a document in a single `asset_ids` batch call (`getLibraryAssetsByIds`)
 * instead of trusting the stale snapshot each chip carries.
 */
export function collectMentionAssetIds(node: unknown, out: Set<string> = new Set()): Set<string> {
  if (!node || typeof node !== 'object') return out;

  if (Array.isArray(node)) {
    for (const child of node) collectMentionAssetIds(child, out);
    return out;
  }

  const el = node as { type?: string; key?: string; assetId?: string; refType?: string; children?: unknown[] };

  if (el.type === KEYS.mention && el.refType !== 'role' && el.key) {
    out.add(el.key);
  }
  if (el.type === ASSET_REFERENCE_KEY && el.assetId) {
    out.add(el.assetId);
  }

  if (Array.isArray(el.children)) {
    for (const child of el.children) collectMentionAssetIds(child, out);
  }

  return out;
}

/**
 * true si el árbol tiene al menos una referencia a un rol (legacy `mention` con
 * `refType: 'role'`, o el `role_reference` actual) — gatea el fetch de
 * `useRolesMap` (trae TODOS los roles de la org) para no pagarlo en documentos
 * que no mencionan ningún rol.
 */
export function hasAnyRoleReference(node: unknown): boolean {
  if (!node || typeof node !== 'object') return false;

  if (Array.isArray(node)) {
    return node.some((child) => hasAnyRoleReference(child));
  }

  const el = node as { type?: string; refType?: string; children?: unknown[] };

  if (el.type === ROLE_REFERENCE_KEY) return true;
  if (el.type === KEYS.mention && el.refType === 'role') return true;

  if (Array.isArray(el.children)) {
    return el.children.some((child) => hasAnyRoleReference(child));
  }

  return false;
}
