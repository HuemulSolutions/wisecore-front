import type { Organization } from '@/types/organization-table'

export interface EditOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization: Organization | null
  onSave: () => void
  isSaving: boolean
  onOrgChange: (org: Organization) => void
  isRootAdmin?: boolean
}
