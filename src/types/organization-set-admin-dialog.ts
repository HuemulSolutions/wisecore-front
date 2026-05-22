import type { Organization } from '@/types/organization-table'

export interface SetOrganizationAdminDialogProps {
  organization: Organization | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}
