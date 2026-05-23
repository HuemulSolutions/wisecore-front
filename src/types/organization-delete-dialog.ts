import type { Organization } from '@/types/organization-table'

export interface DeleteOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization: Organization | null
  onConfirm: () => Promise<void>
}
