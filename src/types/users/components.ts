import type { User, UserDialogsState, UserDetailTab } from './core'
import type { HuemulTablePagination } from '@/types/huemul'
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
  // `UserDialogsState`, no `UserPageState`: este contenedor solo lee/cierra
  // diálogos, nunca el master-detail. Estructuralmente compatible con
  // `UserPageState` (users.tsx) y con `GlobalAdminUserPageState`
  // (global-admin-users-section.tsx), que ya no comparten el mismo padre.
  //
  // Solo quedan `CreateUserSheet` y `UserDeleteDialog`: editar, root admin y
  // asignar organizaciones pasaron a ser inline en `UserDetailPanel` (tabs
  // Perfil/Organizaciones) en ambos consumidores — ver
  // `users-edit-sheet.tsx`/`users-root-admin-dialog.tsx`/
  // `users-organizations-dialog.tsx` (retirados).
  state: UserDialogsState
  onCloseDialog: (dialog: keyof UserDialogsState) => void
  onUpdateState: (updates: Partial<UserDialogsState>) => void
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
  canDelete: boolean
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
  canCreate?: boolean
}

export interface UserTableProps {
  users: User[]
  selectedUsers: Set<string>
  onUserSelection: (userId: string) => void
  onSelectAll: () => void
  /**
   * Abre el panel de detalle de este usuario. `tab` fuerza la pestaña (ej. el
   * chip de rol abre directo en 'roles'); sin `tab`, el panel conserva la
   * última pestaña activa. Reemplaza a las acciones de fila de la versión
   * anterior (editar/asignar roles/eliminar/root admin): esas viven ahora
   * dentro del panel (tab Perfil / tab Roles).
   */
  onSelectUser: (user: User, tab?: UserDetailTab) => void
  /** Fila resaltada como activa (vía `getRowClassName`, no `selectedKeys`). */
  selectedUserId?: string | null
  /**
   * Habilita el cruce con `useRolesMap` para pintar el punto de color de los
   * chips de rol (`UserRole` no trae `color`). Sin permiso, los chips caen al
   * color de fallback de `roleRowSwatch` — no se ocultan.
   */
  canListRoles?: boolean
  pagination?: HuemulTablePagination
  isLoading?: boolean
  isFetching?: boolean
}
