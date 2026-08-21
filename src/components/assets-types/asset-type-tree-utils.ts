// Prefijos usados para las keys de fila del árbol carpeta/tipo de documento
// en la tabla de asset-types (ver assets-types-table.tsx y src/pages/assets-types.tsx).
// Evita colisiones entre `selectedKeys` de carpetas y de tipos de documento.
export const FOLDER_ROW_PREFIX = "folder:"
export const ASSET_TYPE_ROW_PREFIX = "type:"

export const folderRowId = (folderId: string) => `${FOLDER_ROW_PREFIX}${folderId}`
export const assetTypeRowId = (assetTypeId: string) => `${ASSET_TYPE_ROW_PREFIX}${assetTypeId}`

/** Deshace `assetTypeRowId`: de una key de fila (`type:{id}`) al id real del tipo de documento. */
export const rawAssetTypeId = (rowId: string) => rowId.slice(ASSET_TYPE_ROW_PREFIX.length)
