// Ruta "pantalla completa" de un asset, ver ia context/fullscreen-share-route-guide.md.
// El primer segmento DEBE ser "asset": scripts/validate-rbac.mjs (si existiera) mapea
// rutas de App.tsx a RBAC_PAGES por el primer segmento del path, así que esta ruta
// hereda RBAC_PAGES.asset sin tocar la matriz.
export const ASSET_FULLSCREEN_PATH = "asset/full"

/**
 * Link a pantalla completa de un asset — sin header global, sin nav, sin árbol de
 * conocimiento. Reusa el mismo AssetContent que /asset, solo cambia el contenedor.
 */
export function buildAssetFullscreenUrl(
  organizationId: string,
  assetId: string,
  executionId?: string,
): string {
  const base = `${window.location.origin}/${organizationId}/${ASSET_FULLSCREEN_PATH}/${assetId}`
  return executionId ? `${base}?execution=${executionId}` : base
}
