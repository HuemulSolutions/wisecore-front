import type { ExternalFunctionality } from './core'

export interface ExternalFunctionalityCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  systemId: string
  onSuccess?: () => void
}

export interface ExternalFunctionalityDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  systemId: string
  functionality: ExternalFunctionality | null
  onDeleted?: () => void
}

export interface ExternalFunctionalityEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  systemId: string
  functionality: ExternalFunctionality | null
}
