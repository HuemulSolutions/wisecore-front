import type { User, UserPageState } from './core'
import type { HuemulTablePagination } from '@/types/huemul'
import type { UseMutationResult } from '@tanstack/react-query'
import type { useUserMutations } from '@/hooks/useUsers'

export interface UserContentEmptyStateProps {
  type: 'empty' | 'error'
  message?: string
  onRetry?: () => void
}

export interface UserFormFieldsProps {
  name: string
  lastName: string
  email: string
  birthDay?: string
  birthMonth?: string
  onNameChange: (name: string) => void
  onLastNameChange: (lastName: string) => void
  onEmailChange: (email: string) => void
  onBirthDayChange?: (day: string) => void
  onBirthMonthChange?: (month: string) => void
  onFileChange?: (files: FileList | null) => void
  includeBirthday?: boolean
  includePhoto?: boolean
  disabled?: boolean
  errors?: Record<string, string>
  emailReadOnly?: boolean
}

export interface UserPageDialogsProps {
  state: UserPageState
  onCloseDialog: (dialog: keyof UserPageState) => void
  onUpdateState: (updates: Partial<UserPageState>) => void
  userMutations: ReturnType<typeof useUserMutations>
  onUsersUpdated?: () => void
  createUserAddToOrganization?: boolean
}

export interface EmptyStateProps {
  type: 'access-denied' | 'no-organization' | 'error'
  message?: string
}

export interface UserPageHeaderProps {
  userCount: number
  onCreateUser: () => void
  onRefresh: () => void
  isLoading: boolean
  hasError?: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
  filterStatus: string
  onStatusFilterChange: (value: string) => void
  canCreate?: boolean
}

export interface UserTableProps {
  users: User[]
  selectedUsers: Set<string>
  onUserSelection: (userId: string) => void
  onSelectAll: () => void
  onEditUser: (user: User) => void
  onViewOrganizations: (user: User) => void
  onAssignRoles: (user: User) => void
  onDeleteUser: (user: User) => void
  onManageRootAdmin: (user: User) => void
  onMakeOrganizationAdmin?: (user: User) => void
  isCurrentUserRootAdmin?: boolean
  userMutations: {
    approveUser: UseMutationResult<any, any, string, unknown>
    rejectUser: UseMutationResult<any, any, string, unknown>
    deleteUser: UseMutationResult<any, any, string, unknown>
  }
  pagination?: HuemulTablePagination
  canUpdate?: boolean
  canDelete?: boolean
  isLoading?: boolean
  isFetching?: boolean
}
