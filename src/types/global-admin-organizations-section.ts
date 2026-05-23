import type { Organization } from '@/types/organization-table'

export interface OrganizationPageState {
  searchTerm: string
  selectedOrganizations: Set<string>
  editingOrganization: Organization | null
  showCreateDialog: boolean
  deletingOrganization: Organization | null
  settingAdminOrganization: Organization | null
}
