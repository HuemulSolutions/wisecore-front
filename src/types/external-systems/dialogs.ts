import type { ExternalSystem } from './core'

export interface ExternalSystemCreateSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  onSuccess?: () => void
}

export interface ExternalSystemDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  system: ExternalSystem | null
  onDeleted?: () => void
}

export interface ExternalSystemEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  system: ExternalSystem | null
  onSuccess?: () => void
}
