// Document type folders — tipos de la vista de árbol (carpeta + tipos anidados) del
// módulo asset-types, y props de los sheets de creación/edición de carpeta.
import type { DocumentTypeFolder } from '../document-type-folders'
import type { AssetTypeWithRoles } from './asset-types'

// ----------------------------------------
// Tree rows (tabla de asset-types agrupada por carpeta)
// ----------------------------------------

export type AssetTypeTreeRow =
  | { kind: 'folder'; id: string; folder: DocumentTypeFolder; itemCount: number }
  | { kind: 'assetType'; id: string; assetType: AssetTypeWithRoles; folderId: string | null; depth: 0 | 1 }

// ----------------------------------------
// Folder Create / Edit Sheets
// ----------------------------------------

export interface AssetTypeFolderCreateSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface AssetTypeFolderEditSheetProps {
  folder: DocumentTypeFolder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** `asset_type:d` — habilita la zona de peligro (eliminar carpeta). */
  canDelete?: boolean
}
