import type { Role, RoleWithAssignment } from '@/types/rbac'

/**
 * Estado visual de un rol dentro del staging del panel de detalle de usuario.
 * Ver `ia context/sheet-footer-batch-save-guide.md` — a diferencia del patrón
 * base (lista espejo hidratada desde el servidor), acá el estado se modela por
 * DELTAS (`added`/`removed`/`created`) sobre `serverAssignedIds`, derivado en
 * cada render: no hay nada que hidratar, así que un refetch nunca pisa un
 * cambio en curso. Ver `useUserRolesStaging`.
 */
export type StagedRoleStatus = 'assigned' | 'added' | 'created' | 'removed'

export interface StagedRole {
  id: string
  name: string
  description: string
  color?: string | null
  permissionNum?: number
  isPosition?: boolean
  parentRoleId?: string | null
  status: StagedRoleStatus
}

export interface UserRolesStagingLastSaved {
  /** role_ids del usuario justo antes de este guardado — lo que reenvía `undo()`. */
  previous: string[]
  /** role_ids aplicados por este guardado. */
  applied: string[]
  at: number
  /**
   * Este guardado incluyó al menos un rol creado en el popover (vía "Rápido"
   * o "Con permisos"). `undo()` reenvía `previous` pero NO borra el rol
   * creado — el copy de la banda de confirmación debe aclararlo.
   */
  hadCreated: boolean
}

export interface UserRolesStagingApi {
  /** Asignados + agregados + creados, con los removidos incluidos (tachados) para poder listarlos. */
  stagedRoles: StagedRole[]
  addedCount: number
  removedCount: number
  createdCount: number
  isDirty: boolean
  isSaving: boolean
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  /** Agrega un rol al staging (desde el popover). `created: true` si viene de crear/clonar en el momento. */
  add: (role: RoleWithAssignment | Role, opts?: { created?: boolean }) => void
  /**
   * Deshace el estado staged de un rol: cancela un "por agregar"/"por crear",
   * o marca un asignado como "por quitar". Cubre tanto el ✕ como el ↩ del
   * chip — el llamador no necesita saber en qué estado está el rol.
   */
  toggle: (roleId: string) => void
  save: () => Promise<void>
  discard: () => void
  undo: () => Promise<void>
  lastSaved: UserRolesStagingLastSaved | null
  dismissUndo: () => void
  refetch: () => Promise<unknown>
}
