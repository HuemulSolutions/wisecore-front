import type { TElement } from 'platejs';

/** Cómo se resuelve la versión de un `asset_reference` al renderizarlo: 'latest'
 * sigue siempre la vigente del documento; 'pinned' queda fijada a `executionItemId`. */
export type ReferenceVersionMode = 'latest' | 'pinned';

/**
 * Nodo inline void que referencia un documento (asset) del panel de contenido.
 * Solo se guardan ids — nombre/color/versión se resuelven al renderizar contra
 * datos frescos (ver `mention-refs-context.tsx`). `name`/`color`/`pinnedVersionLabel`
 * son un snapshot de respaldo: los usa la serialización a Markdown (corre fuera de
 * React, sin acceso al caché de datos frescos) y el primer paint antes de que
 * llegue el lote — la chip en pantalla los descarta en cuanto hay dato fresco.
 */
export interface AssetReferenceElement extends TElement {
  assetId: string;
  documentTypeId?: string | null;
  versionMode: ReferenceVersionMode;
  /** Solo presente cuando `versionMode === 'pinned'`. */
  executionItemId?: string | null;
  name: string;
  color?: string | null;
  /** Label de versión (`v2.3.0`) al momento de fijar — mismo motivo de snapshot que `name`. */
  pinnedVersionLabel?: string | null;
  /** Label de la versión vigente al momento de insertar (solo `versionMode: 'latest'`) — evita
   * que la chip recién insertada se muestre sin versión hasta que llegue el próximo lote fresco. */
  snapshotVersionLabel?: string | null;
}

/** Nodo inline void que referencia un rol. Sin versión — los roles no tienen historial. */
export interface RoleReferenceElement extends TElement {
  roleId: string;
  name: string;
  color?: string | null;
}
