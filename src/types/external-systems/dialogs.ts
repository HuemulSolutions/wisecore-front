import type { ExternalSystem } from './core'

// Las props `canCreate`/`canUpdate`/`canDelete` son OBLIGATORIAS a propósito:
// un default (sobre todo `= true`) es indistinguible de "todavía no lo
// gatearon". Ver ia context/rbac-audit-guide.md, punto 9 del checklist.

export interface ExternalSystemCreateSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  canCreate: boolean
  onSuccess?: () => void
}

export interface ExternalSystemDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  system: ExternalSystem | null
  canDelete: boolean
  onDeleted?: () => void
}

export interface ExternalSystemEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  system: ExternalSystem | null
  canUpdate: boolean
  onSuccess?: () => void
}
