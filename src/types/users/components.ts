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
  notifyDailyDigest?: boolean
  onNotifyDailyDigestChange?: (value: boolean) => void
  includeNotifyDailyDigest?: boolean
}

export interface UserPageDialogsProps {
  state: UserPageState
  onCloseDialog: (dialog: keyof UserPageState) => void
  onUpdateState: (updates: Partial<UserPageState>) => void
  userMutations: ReturnType<typeof useUserMutations>
  onUsersUpdated?: () => void
  createUserAddToOrganization?: boolean
  /**
   * Props de permiso obligatorias (sin default): cada diálogo montado acá
   * muta, y ninguno tenía gate propio. Los consumidores las resuelven con su
   * propio eje — `/users` con `usePageAccess('users')`, `/global-admin` con su
   * único `canManage` root-admin-only.
   */
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  canAssignRoles: boolean
  /** PATCH /users/{id}/root-admin: flag de sistema, eje isRootAdmin. */
  canManageRootAdmin: boolean
  /** POST/DELETE /organizations/{id}/users: solo alcanzable desde /global-admin. */
  canManageOrganizations: boolean
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
  onAssignRoles: (user: User) => void
  onDeleteUser: (user: User) => void
  onManageRootAdmin: (user: User) => void
  onMakeOrganizationAdmin?: (user: User) => void
  /**
   * Eje del flag de sistema `is_root_admin` (PATCH /users/{id}/root-admin).
   * No es un bypass de RBAC: solo decide si se ofrece esa acción de fila.
   */
  canManageRootAdmin?: boolean
  userMutations: {
    approveUser: UseMutationResult<any, any, string, unknown>
    rejectUser: UseMutationResult<any, any, string, unknown>
    deleteUser: UseMutationResult<any, any, string, unknown>
  }
  pagination?: HuemulTablePagination
  canUpdate?: boolean
  canDelete?: boolean
  /** Asignar roles muta vía `rbac:u`, no `user:u`: eje propio. */
  canAssignRoles?: boolean
  isLoading?: boolean
  isFetching?: boolean
}
