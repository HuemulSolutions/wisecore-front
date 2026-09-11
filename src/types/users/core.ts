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
  notify_daily_digest: boolean
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
  max_users: number | null
  token_limit: number | null
  tier: "starter" | "pro" | "enterprise"
  member: boolean
}

export interface UserOrganizationsResponse {
  data: UserOrganization[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
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
  birth_day?: number
  birth_month?: number
  photo_file?: string
  notify_daily_digest?: boolean
}

export interface CreateUserData {
  name: string
  last_name: string
  email: string
  birth_day?: number
  birth_month?: number
  photo_file?: string
}

/**
 * Pestaña activa del panel de detalle del usuario. Sin 'activity': no existe
 * endpoint de auditoría de asignaciones en el backend (ver
 * respuestas/backend-panel-usuarios-roles.md).
 *
 * 'organizations' reemplaza a `UserOrganizationsDialog` (asignar/quitar
 * organizaciones, root-admin-only): en `/global-admin` siempre disponible
 * (junto a 'profile', sin 'roles' — los roles son org-scoped y un usuario
 * global no tiene una organización fija); en `/users` solo si `isRootAdmin`
 * — ver `UserDetailPanelProps.availableTabs`.
 */
export type UserDetailTab = 'profile' | 'roles' | 'organizations'

/**
 * Solo los diálogos/sheets que `UserPageDialogs` monta. Separado de
 * `UserPageState` para que un consumidor sin master-detail (`/global-admin`,
 * ver `GlobalAdminUserPageState`) no cargue `selectedUserId`/`detailTab`, que
 * no usa. `assigningRoleUser` no vive acá: el sheet de asignación
 * (`roles-assign-sheet.tsx`) se eliminó, el panel de detalle absorbe esa
 * función con su propio staging (`useUserRolesStaging`).
 *
 * `editingUser`/`organizationUser`/`rootAdminUser` ya no viven acá: eran
 * exclusivos del kebab de `/global-admin` (`/users` nunca los seteaba — la
 * edición, el switch de root admin y ahora la asignación de organizaciones
 * son inline en el panel de detalle, `UserDetailPanel`). Ver
 * `users-detail-organizations-tab.tsx`, `UsersDetailProfileTab`.
 */
export interface UserDialogsState {
  showCreateDialog: boolean
  deletingUser: User | null
}

/** Estado de tabla + diálogos, sin el master-detail. Lo que reusa `/global-admin`. */
export interface UserListState extends UserDialogsState {
  searchTerm: string
  selectedUsers: Set<string>
}

export interface UserPageState extends UserListState {
  /** Fila activa del layout master-detail. `null` = panel cerrado. */
  selectedUserId: string | null
  detailTab: UserDetailTab
}

export interface UserPageActions {
  updateState: (updates: Partial<UserPageState>) => void
  closeDialog: (dialog: keyof UserDialogsState) => void
  handleUserSelection: (userId: string) => void
  handleSelectAll: () => void
}

export interface GlobalUsersResponse {
  data: User[];
  page: number;
  page_size: number;
  has_next: boolean;
  total?: number;
}
