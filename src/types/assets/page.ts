// Asset type page component props (the asset-types management module)
import type { ReactNode } from 'react'
import type { AssetTypeWithRoles, TemplatesSaveApiRef } from './asset-types'
import type { AssetTypePageState } from './asset-types'
import type { useAssetTypeMutations } from '@/hooks/useAssetTypes'
import type { HuemulTablePagination } from '@/huemul/components/huemul-table'

// ----------------------------------------
// Content Empty State
// ----------------------------------------

export interface AssetTypeContentEmptyStateProps {
  type: 'empty' | 'error'
  message?: string
  onRetry?: () => void
  onCreateFirst?: () => void
}

// ----------------------------------------
// Create / Edit Asset Type Dialog
// ----------------------------------------

export interface CreateDocumentTypeProps {
  trigger?: ReactNode
  onDocumentTypeCreated?: (documentType: { id: string; name: string; color: string; created_at?: string; document_count?: number }) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  documentType?: AssetTypeWithRoles | null
  type?: 'document' | 'asset'
  /**
   * El mismo sheet hace POST (crear) o PUT (editar) según venga `documentType`,
   * así que el consumidor debe resolver `asset_type:c` o `asset_type:u` y pasar
   * el resultado. Obligatoria y sin default: ver punto 9 del checklist en
   * ia context/rbac-audit-guide.md.
   */
  canSave: boolean
}

// ----------------------------------------
// Asset Type Config Sheet (tabs)
// ----------------------------------------

export type AssetTypeConfigTab = 'general' | 'lifecycle' | 'templates'

export interface AssetTypeConfigSheetProps {
  assetType: AssetTypeWithRoles | null
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  /** `asset_type:u` — habilita el tab General y su botón Guardar. */
  canUpdate: boolean
  /** `manageLinkedTemplates` — habilita el tab Plantillas. */
  canManageTemplates: boolean
  /** `manageLifecycle` — habilita el tab Ciclo de vida. */
  canManageLifecycle: boolean
}

// ----------------------------------------
// Asset Type Templates Panel (tab «Plantillas»)
// ----------------------------------------

export interface AssetTypeTemplatesPanelProps {
  documentTypeId: string
  /** Solo dispara el fetch cuando el tab/panel está visible. */
  enabled?: boolean
  /** Publica `save`/`isDirty`/`discard` hacia el footer del sheet. `null` al desmontar. */
  onDirtyChange?: (state: { isDirty: boolean }) => void
  saveApiRef?: TemplatesSaveApiRef
}

// ----------------------------------------
// Form Fields
// ----------------------------------------

export interface DocumentTypeFormFieldsProps {
  name: string
  color: string
  onNameChange: (value: string) => void
  onColorChange: (value: string) => void
  errors?: {
    name?: string
    color?: string
  }
  disabled?: boolean
}

// ----------------------------------------
// Page Dialogs
// ----------------------------------------

export interface AssetTypePageDialogsProps {
  state: AssetTypePageState
  onCloseDialog: (dialog: keyof AssetTypePageState) => void
  onUpdateState: (updates: Partial<AssetTypePageState>) => void
  assetTypeMutations: ReturnType<typeof useAssetTypeMutations>
  onImportSuccess: () => void
  /** Ids de tipos de activo seleccionados en la tabla para exportar. */
  exportSelectedIds: string[]
  /** Llamado tras una exportación exitosa (p.ej. para limpiar la selección). */
  onExported?: () => void
  /** Llamado tras crear (no editar) un asset type nuevo, para poder fijarlo al tope de la tabla. */
  onAssetTypeCreated?: (assetType: { id: string; name: string; color: string; created_at?: string; document_count?: number }) => void
}

// ----------------------------------------
// Page Empty State
// ----------------------------------------

export interface AssetTypePageEmptyStateProps {
  type: 'access-denied' | 'error'
  message?: string
}

// ----------------------------------------
// Page Header
// ----------------------------------------

export interface AssetTypePageHeaderProps {
  assetTypeCount: number
  onCreateAssetType: () => void
  onRefresh: () => void
  isLoading: boolean
  hasError?: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
  canCreate?: boolean
  viewMode?: 'table' | 'relationships'
  onViewModeChange?: (mode: 'table' | 'relationships') => void
  onExport?: () => void
  onImport?: () => void
  canExport?: boolean
  canImport?: boolean
  /** Cantidad de filas seleccionadas para exportar; deshabilita Exportar si es 0. */
  exportSelectedCount?: number
}

// ----------------------------------------
// Table
// ----------------------------------------

export interface AssetTypeTableProps {
  assetTypes: AssetTypeWithRoles[]
  /** Abre el sheet de configuración (general + plantillas + ciclo de vida). */
  onConfigureAssetType: (assetType: AssetTypeWithRoles) => void
  onDeleteAssetType: (assetType: AssetTypeWithRoles) => void
  onCloneAssetType: (assetType: AssetTypeWithRoles) => void
  onViewRelationships: (assetType: AssetTypeWithRoles) => void
  pagination?: HuemulTablePagination
  /** True si el usuario puede abrir al menos un tab del sheet de configuración. */
  canConfigure?: boolean
  canDelete?: boolean
  canViewRelationships?: boolean
  canClone?: boolean
  isLoading?: boolean
  isFetching?: boolean
  selectedIds: Set<string>
  onSelectionChange: (keys: Set<string>) => void
}
