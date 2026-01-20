export interface UserRole {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name: string
  last_name: string
  status: 'active' | 'inactive' | 'pending'
  activated_at: string | null
  external_id: string | null
  auth_type_id: string
  updated_at: string
  created_at: string
  birthdate: string | null
  birth_day?: number
  birth_month?: number
  is_root_admin: boolean
  photo_url: string | null
  user_metadata: any | null
  roles: UserRole[]
}

export interface UsersResponse {
  data: User[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  timestamp: string
}

export interface UserOrganization {
  id: string
  name: string
  db_name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface UserOrganizationsResponse {
  data: UserOrganization[]
  transaction_id: string
  timestamp: string
}

export interface AssignUserToOrganizationData {
  user_id: string
}

export interface UpdateUserData {
  name?: string
  last_name?: string
  email?: string
  birthdate?: string | null
}

export interface CreateUserData {
  name: string
  last_name: string
  email: string
  birth_day?: number
  birth_month?: number
  photo_file?: string
}

// User page state and actions
export interface UserPageState {
  searchTerm: string
  filterStatus: string
  selectedUsers: Set<string>
  editingUser: User | null
  organizationUser: User | null
  showCreateDialog: boolean
  assigningRoleUser: User | null
  deletingUser: User | null
  rootAdminUser: User | null
}

export interface UserPageActions {
  updateState: (updates: Partial<UserPageState>) => void
  closeDialog: (dialog: keyof UserPageState) => void
  handleUserSelection: (userId: string) => void
  handleSelectAll: () => void
}
