import type { Organization } from '@/types/organizations'

export interface OrganizationPageState {
  searchTerm: string
  selectedOrganizations: Set<string>
  editingOrganization: Organization | null
  showCreateDialog: boolean
  deletingOrganization: Organization | null
  settingAdminOrganization: Organization | null
}

import type { User } from '@/types/users'

export interface GlobalUsersResponse {
  data: User[]
  page: number
  page_size: number
  has_next: boolean
  total?: number
}
