// Asset type page component props (the asset-types management module)
import type { ReactNode } from 'react'
import type { AssetTypeWithRoles } from './asset-types'
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
  onDocumentTypeCreated?: (documentType: { id: string; name: string; color: string }) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  documentType?: AssetTypeWithRoles | null
  type?: 'document' | 'asset'
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
}

// ----------------------------------------
// Table
// ----------------------------------------

export interface AssetTypeTableProps {
  assetTypes: AssetTypeWithRoles[]
  onEditAssetType: (assetType: AssetTypeWithRoles) => void
  onDeleteAssetType: (assetType: AssetTypeWithRoles) => void
  onCloneAssetType: (assetType: AssetTypeWithRoles) => void
  onLifecycle: (assetType: AssetTypeWithRoles) => void
  onViewRelationships: (assetType: AssetTypeWithRoles) => void
  pagination?: HuemulTablePagination
  canUpdate?: boolean
  canDelete?: boolean
  isLoading?: boolean
  isFetching?: boolean
}
