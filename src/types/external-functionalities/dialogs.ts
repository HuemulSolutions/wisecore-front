import type { ExternalFunctionality } from './core'

// `canCreate`/`canUpdate`/`canDelete` obligatorias: sin default, para que un
// call-site nuevo rompa el build en vez de reabrir el hueco en silencio.
// Ver ia context/rbac-audit-guide.md, punto 9 del checklist.

export interface ExternalFunctionalityCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  systemId: string
  canCreate: boolean
  onSuccess?: () => void
}

export interface ExternalFunctionalityDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  systemId: string
  functionality: ExternalFunctionality | null
  canDelete: boolean
  onDeleted?: () => void
}

export interface ExternalFunctionalityEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  systemId: string
  functionality: ExternalFunctionality | null
  canUpdate: boolean
}
