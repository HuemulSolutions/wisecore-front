import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRoleWithAllUsers, useRoleMutations } from "@/hooks/useRbac"
import type { UserWithAssignment } from "@/services/rbac"
import type { User } from "@/types/users"
import type {
  RoleUsersStagingApi,
  RoleUsersStagingLastSaved,
  StagedRoleUser,
  StagedRoleUserStatus,
} from "@/types/roles/users-staging"

/**
 * Mismo motivo que `ALL_ROLES_PAGE_SIZE` en `useUserRolesStaging.ts`: el
 * guardado (`POST /user_roles/{roleId}/bulk_users`) reemplaza la lista
 * completa de usuarios del rol — hay que traerla completa para no truncarla.
 */
const ALL_USERS_PAGE_SIZE = 1000

function toStagedUser(user: UserWithAssignment | User, status: StagedRoleUserStatus): StagedRoleUser {
  return {
    id: user.id,
    name: user.name,
    lastName: user.last_name,
    email: user.email,
    photoUrl: user.photo_url,
    isRootAdmin: user.is_root_admin,
    status,
  }
}

export interface UseRoleUsersStagingOptions {
  enabled: boolean
  canAssignUsers: boolean
  /** `Role.users_count`, para el mismo assert de desarrollo que `useUserRolesStaging`. */
  expectedAssignedCount?: number
}

/**
 * Staging de usuarios asignados a un rol, por DELTAS — espejo de
 * `useUserRolesStaging` para la dirección inversa. Reemplaza a
 * `roles-assign-to-users-sheet.tsx` (eliminado): el panel de detalle de
 * `/roles` asigna/quita/crea usuarios sin salir de la página.
 */
export function useRoleUsersStaging(
  roleId: string | null,
  { enabled, canAssignUsers, expectedAssignedCount }: UseRoleUsersStagingOptions,
): RoleUsersStagingApi {
  const [addedUsers, setAddedUsers] = useState<Map<string, StagedRoleUser>>(new Map())
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [createdIds, setCreatedIds] = useState<Set<string>>(new Set())
  const [lastSaved, setLastSaved] = useState<RoleUsersStagingLastSaved | null>(null)

  const { data, isLoading, isFetching, error, refetch } = useRoleWithAllUsers(
    roleId ?? "",
    enabled && !!roleId,
    1,
    ALL_USERS_PAGE_SIZE,
  )
  const { assignUsersToRole } = useRoleMutations()

  const serverUsers = useMemo(() => data?.data?.users ?? [], [data])

  useEffect(() => {
    setAddedUsers(new Map())
    setRemovedIds(new Set())
    setCreatedIds(new Set())
    setLastSaved(null)
  }, [roleId])

  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (expectedAssignedCount == null || !data) return
    const assignedCount = serverUsers.filter((u) => u.has_role).length
    if (assignedCount !== expectedAssignedCount) {
      // eslint-disable-next-line no-console
      console.warn(
        `useRoleUsersStaging: se esperaban ${expectedAssignedCount} usuarios asignados ` +
        `(Role.users_count) pero useRoleWithAllUsers con pageSize=${ALL_USERS_PAGE_SIZE} ` +
        `devolvió ${assignedCount}. Ver respuestas/backend-panel-usuarios-roles.md punto 2.`,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expectedAssignedCount, data])

  const stagedUsers = useMemo<StagedRoleUser[]>(() => {
    const list: StagedRoleUser[] = []
    for (const user of serverUsers) {
      if (!user.has_role) continue
      list.push(toStagedUser(user, removedIds.has(user.id) ? "removed" : "assigned"))
    }
    for (const staged of addedUsers.values()) list.push(staged)
    return list
  }, [serverUsers, removedIds, addedUsers])

  const add = useCallback((user: UserWithAssignment | User, opts?: { created?: boolean }) => {
    const status: StagedRoleUserStatus = opts?.created ? "created" : "added"
    setAddedUsers((prev) => {
      if (prev.has(user.id)) return prev
      const next = new Map(prev)
      next.set(user.id, toStagedUser(user, status))
      return next
    })
    setRemovedIds((prev) => {
      if (!prev.has(user.id)) return prev
      const next = new Set(prev)
      next.delete(user.id)
      return next
    })
    if (opts?.created) {
      setCreatedIds((prev) => {
        const next = new Set(prev)
        next.add(user.id)
        return next
      })
    }
  }, [])

  const toggle = useCallback((userId: string) => {
    setAddedUsers((prevAdded) => {
      if (prevAdded.has(userId)) {
        const next = new Map(prevAdded)
        next.delete(userId)
        return next
      }
      return prevAdded
    })
    setCreatedIds((prev) => {
      if (!prev.has(userId)) return prev
      const next = new Set(prev)
      next.delete(userId)
      return next
    })
    setRemovedIds((prev) => {
      const wasAdded = addedUsers.has(userId)
      if (wasAdded) return prev
      const isServerAssigned = serverUsers.some((u) => u.id === userId && u.has_role)
      if (prev.has(userId)) {
        const next = new Set(prev)
        next.delete(userId)
        return next
      }
      if (!isServerAssigned) return prev
      const next = new Set(prev)
      next.add(userId)
      return next
    })
  }, [addedUsers, serverUsers])

  const discard = useCallback(() => {
    setAddedUsers(new Map())
    setRemovedIds(new Set())
    setCreatedIds(new Set())
  }, [])

  const dismissUndo = useCallback(() => setLastSaved(null), [])

  const isDirty = addedUsers.size > 0 || removedIds.size > 0

  const saveRef = useRef<() => Promise<void>>(async () => {})
  saveRef.current = async () => {
    if (!roleId || !canAssignUsers || !isDirty) return
    const fresh = await refetch()
    const freshServerUsers = fresh.data?.data?.users ?? []
    const freshAssignedIds = new Set(freshServerUsers.filter((u) => u.has_role).map((u) => u.id))
    const previous = [...freshAssignedIds]
    const nextIds = new Set(freshAssignedIds)
    for (const id of addedUsers.keys()) nextIds.add(id)
    for (const id of removedIds) nextIds.delete(id)
    const applied = [...nextIds]
    await assignUsersToRole.mutateAsync({ roleId, userIds: applied })
    setLastSaved({ previous, applied, at: Date.now() })
    setAddedUsers(new Map())
    setRemovedIds(new Set())
    setCreatedIds(new Set())
  }
  const save = useCallback(() => saveRef.current(), [])

  const undo = useCallback(async () => {
    if (!roleId || !lastSaved) return
    await assignUsersToRole.mutateAsync({ roleId, userIds: lastSaved.previous })
    setLastSaved(null)
  }, [roleId, lastSaved, assignUsersToRole])

  return {
    stagedUsers,
    addedCount: addedUsers.size,
    removedCount: removedIds.size,
    createdCount: createdIds.size,
    isDirty,
    isSaving: assignUsersToRole.isPending,
    isLoading,
    isFetching,
    error: error as Error | null,
    add,
    toggle,
    save,
    discard,
    undo,
    lastSaved,
    dismissUndo,
    refetch,
  }
}
