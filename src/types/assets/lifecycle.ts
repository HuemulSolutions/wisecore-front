// Lifecycle step component props for the asset type configuration module
import type { HTMLAttributes } from 'react'
import type { AssetTypeWithRoles } from './asset-types'

// ----------------------------------------
// Config Step
// ----------------------------------------

export interface ConfigStepContentProps {
  documentTypeId: string
  stepType: string
  stepLabel: string
  hasSla: boolean
  hasValidity?: boolean
  onRegisterSave?: (fn: (() => Promise<void>) | null, isPending: boolean) => void
  onEditingChange?: (isEditing: boolean) => void
}

// ----------------------------------------
// Create Step
// ----------------------------------------

export interface CreateStepContentProps {
  documentTypeId: string
  stepType: string
  hasSla?: boolean
  hasValidity?: boolean
  noOwner?: boolean
  useAllOrCustomOwner?: boolean
  onEditingChange?: (isEditing: boolean) => void
  organizationId?: string
}

// ----------------------------------------
// Lifecycle Dialog
// ----------------------------------------

export interface DefaultStepContentProps {
  documentTypeId: string
  stepType: string
  stepLabel: string
}

export interface StepContentProps {
  documentTypeId: string
  stepType: string
  stepLabel: string
  onEditingChange?: (isEditing: boolean) => void
  organizationId?: string
}

export interface AssetTypeLifecycleDialogProps {
  assetType: AssetTypeWithRoles | null
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId?: string
}

// ----------------------------------------
// Asset Lifecycle Sheet
// ----------------------------------------

export interface AssetLifecycleSheetProps {
  asset: { id: string; name: string; document_type_id: string | null } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ----------------------------------------
// Edit Step
// ----------------------------------------

export interface EditStepCardData {
  id: string
  name: string
  mode: "manual" | "automatic"
  hasSla: boolean
  slaValue: string
  slaUnit: string
  accessType: "all" | "owner" | "custom" | "custom_owner"
  ownerCanExecute: boolean
  roleIds: string[]
  roleNames: Record<string, string>
}

export interface EditStepContentProps {
  documentTypeId: string
  stepType: string
  onEditingChange?: (isEditing: boolean) => void
  organizationId?: string
}

export interface EditStepCardProps {
  card: EditStepCardData
  stepType: string
  slaUnitOptions: { value: string; label: string }[]
  allRoles: { id: string; name: string }[]
  onChange: (updated: Partial<EditStepCardData>) => void
  onDelete: () => void
  onSave: () => Promise<void>
  t: (key: string, options?: Record<string, unknown>) => string
  isDeleting: boolean
  canDelete: boolean
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>
  onEditingChange?: (isEditing: boolean) => void
  organizationId?: string
}
