import { type User } from "@/services/users"

export interface UserPageState {
  searchTerm: string
  filterStatus: string
  selectedUsers: Set<string>
  editingUser: User | null
  organizationUser: User | null
  showCreateDialog: boolean
  assigningRoleUser: User | null
  deletingUser: User | null
}

export interface UserPageActions {
  updateState: (updates: Partial<UserPageState>) => void
  closeDialog: (dialog: keyof UserPageState) => void
  handleUserSelection: (userId: string) => void
  handleSelectAll: () => void
}