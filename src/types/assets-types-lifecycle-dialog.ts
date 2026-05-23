import type { AssetTypeWithRoles } from '@/services/asset-types'

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
}

export interface AssetTypeLifecycleDialogProps {
  assetType: AssetTypeWithRoles | null
  open: boolean
  onOpenChange: (open: boolean) => void
}
