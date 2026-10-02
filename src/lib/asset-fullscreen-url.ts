import { pathBelongsToOtherOrg, sanitizeReturnPath } from "@/lib/return-url"

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

/** Query param con la ruta a la que vuelve "salir de pantalla completa". */
export const ASSET_FULLSCREEN_RETURN_PARAM = "return"

/** Query param de solo visualización (`AssetContent viewOnly`): lo pone quien abre la vista en
 * ese modo, por ejemplo el modo Consulta de una colección. */
export const ASSET_FULLSCREEN_VIEW_ONLY_PARAM = "view_only"

/**
 * Ruta interna (relativa a la organización, para `useOrgNavigate`) de la pantalla
 * completa de un asset. `returnTo` es la pantalla que la abrió: al salir se vuelve
 * ahí (la saneó `asset-fullscreen.tsx` antes de navegar). Sin `returnTo`, al salir
 * se cae en `/asset/:id`. `viewOnly` conserva el modo de solo visualización de quien la abrió.
 */
export function buildAssetFullscreenPath(
  assetId: string,
  options: { executionId?: string | null; returnTo?: string | null; viewOnly?: boolean } = {},
): string {
  const params = new URLSearchParams()
  if (options.executionId) params.set("execution", options.executionId)
  if (options.returnTo) params.set(ASSET_FULLSCREEN_RETURN_PARAM, options.returnTo)
  if (options.viewOnly) params.set(ASSET_FULLSCREEN_VIEW_ONLY_PARAM, "1")
  const query = params.toString()
  return `/${ASSET_FULLSCREEN_PATH}/${assetId}${query ? `?${query}` : ""}`
}

/**
 * Adónde vuelve "salir de pantalla completa": el `return` de la URL si es una ruta
 * relativa del front y de esta organización; si no, la vista del asset en /asset.
 */
export function resolveFullscreenReturn(rawReturn: string | null, organizationId: string, assetId: string): string {
  const returnTo = sanitizeReturnPath(rawReturn)
  if (returnTo && !pathBelongsToOtherOrg(returnTo, organizationId)) return returnTo
  return `/asset/${assetId}`
}
