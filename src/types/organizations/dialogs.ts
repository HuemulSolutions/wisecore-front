import type { Organization } from './table'

export interface CreateOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string; description?: string }) => void
  isPending: boolean
}

export interface DeleteOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization: Organization | null
  onConfirm: () => Promise<void>
}

export interface EditOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization: Organization | null
  onSave: () => void
  isSaving: boolean
  onOrgChange: (org: Organization) => void
  isRootAdmin?: boolean
}

export interface SetOrganizationAdminDialogProps {
  organization: Organization | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}
