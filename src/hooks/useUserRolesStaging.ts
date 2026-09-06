import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useUserAllRoles, useRoleMutations } from "@/hooks/useRbac"
import type { Role, RoleWithAssignment } from "@/types/rbac"
import type {
  StagedRole,
  StagedRoleStatus,
  UserRolesStagingApi,
  UserRolesStagingLastSaved,
} from "@/types/users/roles-staging"

/**
 * page_size grande para traer TODOS los roles (con su `has_role`) en una sola
 * página — mismo truco que `ALL_ROLES_PAGE_SIZE` en
 * `src/contexts/role-refs-context.tsx:12`. Es imprescindible acá: el endpoint
 * de guardado (`POST /user_roles/bulk_role_assign/{userId}`) REEMPLAZA la
 * lista completa de roles del usuario. Si `serverAssignedIds` viniera de una
 * sola página paginada, un guardado borraría los roles de las demás páginas
 * (el bug real de `roles-assign-sheet.tsx`, que este hook reemplaza).
 */
const ALL_ROLES_PAGE_SIZE = 1000

function toStagedRole(role: RoleWithAssignment | Role, status: StagedRoleStatus): StagedRole {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    color: role.color ?? null,
    permissionNum: role.permission_num,
    isPosition: role.is_position,
    parentRoleId: role.parent_role_id ?? null,
    status,
  }
}

export interface UseUserRolesStagingOptions {
  enabled: boolean
  canAssignRoles: boolean
  /**
   * `User.roles.length` (viene completo en `GET /user_roles/users_with_roles`)
   * — solo para un assert de desarrollo: si difiere de lo que trae
   * `useUserAllRoles` con `ALL_ROLES_PAGE_SIZE`, la organización tiene más
   * roles que el tope elegido y el guardado puede truncar. Ver
   * `respuestas/backend-panel-usuarios-roles.md` punto 2.
   */
  expectedAssignedCount?: number
}

/**
 * Staging de roles asignados a un usuario, por DELTAS (no lista espejo) —
 * ver `src/types/users/roles-staging.ts` y
 * `ia context/sheet-footer-batch-save-guide.md`. Reemplaza a
 * `roles-assign-sheet.tsx` (eliminado): el panel de detalle de `/users`
 * asigna/quita/crea roles sin salir de la página, con una sola llamada de
 * guardado.
 */
export function useUserRolesStaging(
  userId: string | null,
  { enabled, canAssignRoles, expectedAssignedCount }: UseUserRolesStagingOptions,
): UserRolesStagingApi {
  const [addedRoles, setAddedRoles] = useState<Map<string, StagedRole>>(new Map())
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [createdIds, setCreatedIds] = useState<Set<string>>(new Set())
  const [lastSaved, setLastSaved] = useState<UserRolesStagingLastSaved | null>(null)

  const { data, isLoading, isFetching, error, refetch } = useUserAllRoles(
    userId ?? "",
    enabled && !!userId,
    1,
    ALL_ROLES_PAGE_SIZE,
  )
  const { assignRoles } = useRoleMutations()

  const serverRoles = useMemo(() => data?.data ?? [], [data])

  // Un usuario nuevo no hereda el staging del anterior — ni sus cambios
  // pendientes ni la banda de "guardado" del que estaba antes.
  useEffect(() => {
    setAddedRoles(new Map())
    setRemovedIds(new Set())
    setCreatedIds(new Set())
    setLastSaved(null)
  }, [userId])

  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (expectedAssignedCount == null || !data) return
    const assignedCount = serverRoles.filter((r) => r.has_role).length
    if (assignedCount !== expectedAssignedCount) {
      // eslint-disable-next-line no-console
      console.warn(
        `useUserRolesStaging: se esperaban ${expectedAssignedCount} roles asignados ` +
        `(User.roles.length) pero useUserAllRoles con pageSize=${ALL_ROLES_PAGE_SIZE} ` +
        `devolvió ${assignedCount}. La organización puede tener más de ${ALL_ROLES_PAGE_SIZE} ` +
        `roles — el guardado (reemplazo total) podría truncar. Ver ` +
        `respuestas/backend-panel-usuarios-roles.md punto 2.`,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expectedAssignedCount, data])

  const stagedRoles = useMemo<StagedRole[]>(() => {
    const list: StagedRole[] = []
    for (const role of serverRoles) {
      if (!role.has_role) continue
      list.push(toStagedRole(role, removedIds.has(role.id) ? "removed" : "assigned"))
    }
    for (const staged of addedRoles.values()) {
      list.push(staged)
    }
    return list
  }, [serverRoles, removedIds, addedRoles])

  const add = useCallback((role: RoleWithAssignment | Role, opts?: { created?: boolean }) => {
    const status: StagedRoleStatus = opts?.created ? "created" : "added"
    setAddedRoles((prev) => {
      if (prev.has(role.id)) return prev
      const next = new Map(prev)
      next.set(role.id, toStagedRole(role, status))
      return next
    })
    // Si el rol venía marcado "por quitar" (raro, pero posible si se buscó
    // el mismo rol después de removerlo), reasignarlo cancela la remoción.
    setRemovedIds((prev) => {
      if (!prev.has(role.id)) return prev
      const next = new Set(prev)
      next.delete(role.id)
      return next
    })
    if (opts?.created) {
      setCreatedIds((prev) => {
        const next = new Set(prev)
        next.add(role.id)
        return next
      })
    }
  }, [])

  const toggle = useCallback((roleId: string) => {
    setAddedRoles((prevAdded) => {
      if (prevAdded.has(roleId)) {
        // Estaba "por agregar"/"por crear": cancelarlo lo saca del staging entero.
        const next = new Map(prevAdded)
        next.delete(roleId)
        return next
      }
      return prevAdded
    })
    setCreatedIds((prev) => {
      if (!prev.has(roleId)) return prev
      const next = new Set(prev)
      next.delete(roleId)
      return next
    })
    setRemovedIds((prev) => {
      const wasAdded = addedRoles.has(roleId)
      if (wasAdded) {
        // Ya se resolvió arriba (cancelar el agregado) — no marcar "por quitar".
        return prev
      }
      const isServerAssigned = serverRoles.some((r) => r.id === roleId && r.has_role)
      if (prev.has(roleId)) {
        // Ya estaba "por quitar": el mismo botón funciona como "deshacer".
        const next = new Set(prev)
        next.delete(roleId)
        return next
      }
      if (!isServerAssigned) return prev
      const next = new Set(prev)
      next.add(roleId)
      return next
    })
  }, [addedRoles, serverRoles])

  const discard = useCallback(() => {
    setAddedRoles(new Map())
    setRemovedIds(new Set())
    setCreatedIds(new Set())
  }, [])

  const dismissUndo = useCallback(() => setLastSaved(null), [])

  const isDirty = addedRoles.size > 0 || removedIds.size > 0

  // El closure de guardado vive en un ref reasignado en cada render (ver
  // ia context/sheet-footer-batch-save-guide.md regla 1): `save` mantiene
  // identidad estable sin re-registrar nada en cada tecleo/click.
  const saveRef = useRef<() => Promise<void>>(async () => {})
  saveRef.current = async () => {
    if (!userId || !canAssignRoles || !isDirty) return
    // Recalcular contra lo MÁS fresco posible antes de reemplazar: reduce (no
    // elimina — el endpoint no soporta control de concurrencia, ver
    // respuestas/backend-panel-usuarios-roles.md punto 5) la ventana en la que
    // otro admin asignando en paralelo se pisaría con este guardado.
    const fresh = await refetch()
    const freshServerRoles = fresh.data?.data ?? []
    const freshAssignedIds = new Set(freshServerRoles.filter((r) => r.has_role).map((r) => r.id))
    const previous = [...freshAssignedIds]
    const nextIds = new Set(freshAssignedIds)
    for (const id of addedRoles.keys()) nextIds.add(id)
    for (const id of removedIds) nextIds.delete(id)
    const applied = [...nextIds]
    // Se envía siempre, [] incluido si corresponde — el endpoint interpreta la
    // lista como reemplazo total (ver sheet-footer-batch-save-guide.md regla 9).
    await assignRoles.mutateAsync({ userId, roleIds: applied })
    setLastSaved({ previous, applied, at: Date.now(), hadCreated: createdIds.size > 0 })
    setAddedRoles(new Map())
    setRemovedIds(new Set())
    setCreatedIds(new Set())
  }
  const save = useCallback(() => saveRef.current(), [])

  const undo = useCallback(async () => {
    if (!userId || !lastSaved) return
    await assignRoles.mutateAsync({ userId, roleIds: lastSaved.previous })
    setLastSaved(null)
  }, [userId, lastSaved, assignRoles])

  return {
    stagedRoles,
    addedCount: addedRoles.size,
    removedCount: removedIds.size,
    createdCount: createdIds.size,
    isDirty,
    isSaving: assignRoles.isPending,
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
