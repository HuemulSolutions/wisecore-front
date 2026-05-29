import type { Organization } from './table'

export interface OrganizationPageState {
  searchTerm: string
  selectedOrganizations: Set<string>
  editingOrganization: Organization | null
  showCreateDialog: boolean
  deletingOrganization: Organization | null
}

export interface OrganizationUser {
  id: string;
  email: string;
  name: string;
  last_name: string;
  status: string;
  is_org_admin: boolean;
}

export interface OrganizationUsersResponse {
  transaction_id: string;
  data: OrganizationUser[];
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface SetOrganizationAdminResponse {
  transaction_id: string;
  data: {
    organization_id: string;
    user_id: string;
    message: string;
  };
}
