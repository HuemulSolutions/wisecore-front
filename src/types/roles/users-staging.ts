import type { UserWithAssignment } from '@/services/rbac'
import type { User } from '@/types/users'

/**
 * Espejo de `src/types/users/roles-staging.ts` para la dirección inversa
 * (rol → usuarios, tab "Usuarios" del panel de detalle de `/roles`). Mismo
 * modelo por deltas — ver `useRoleUsersStaging`.
 */
export type StagedRoleUserStatus = 'assigned' | 'added' | 'created' | 'removed'

export interface StagedRoleUser {
  id: string
  name: string
  lastName: string
  email: string
  photoUrl: string | null
  isRootAdmin: boolean
  status: StagedRoleUserStatus
}

export interface RoleUsersStagingLastSaved {
  previous: string[]
  applied: string[]
  at: number
}

export interface RoleUsersStagingApi {
  stagedUsers: StagedRoleUser[]
  addedCount: number
  removedCount: number
  createdCount: number
  isDirty: boolean
  isSaving: boolean
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  /** Agrega un usuario al staging (desde el popover). `created: true` si viene de crear un usuario nuevo en el momento. */
  add: (user: UserWithAssignment | User, opts?: { created?: boolean }) => void
  /** Deshace el estado staged de un usuario — cubre tanto el ✕ como el ↩. */
  toggle: (userId: string) => void
  save: () => Promise<void>
  discard: () => void
  undo: () => Promise<void>
  lastSaved: RoleUsersStagingLastSaved | null
  dismissUndo: () => void
  refetch: () => Promise<unknown>
}
