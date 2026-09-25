import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRolePermissions, useRoleMutations } from "@/hooks/useRbac"
import type { RolePermissionsStagingApi } from "@/types/roles/permissions-staging"

function setsEqual(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false
  for (const id of a) if (!b.has(id)) return false
  return true
}

export interface UseRolePermissionsStagingOptions {
  enabled: boolean
  canUpdate: boolean
}

/**
 * Staging de permisos de un rol para el tab "Permisos" del panel de detalle
 * — ver `RolePermissionsStagingApi`. `getRolePermissions` trae el catálogo
 * completo (hasta 1000, sin paginar) con `.assigned`; no se manda `search`
 * al backend porque el buscador y "Solo asignados" son filtros client-side
 * (mandar `search` fragmentaría la selección entre resultados de distintas
 * búsquedas server-side — ver plan).
 */
export function useRolePermissionsStaging(
  roleId: string | null,
  { enabled, canUpdate }: UseRolePermissionsStagingOptions,
): RolePermissionsStagingApi {
  const { data, isLoading, error } = useRolePermissions(roleId ?? "", enabled && !!roleId)
  const { updateRole } = useRoleMutations()

  const permissions = useMemo(() => data?.data?.permissions ?? [], [data])

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const baselineRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    setSelectedIds(new Set())
    baselineRef.current = new Set()
  }, [roleId])

  const isDirty = !setsEqual(selectedIds, baselineRef.current)

  // Hidratar solo si está limpio — ver ia context/sheet-footer-batch-save-guide.md
  // regla 3: si el usuario está editando permisos y en paralelo se invalida
  // rbacQueryKeys.roles (ej. al guardar el tab Detalles), este efecto no debe
  // pisar la selección en curso.
  useEffect(() => {
    if (!data || isDirty) return
    const assigned = new Set(permissions.filter((p) => p.assigned).map((p) => p.id))
    baselineRef.current = assigned
    setSelectedIds(assigned)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isDirty])

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleMany = useCallback((ids: string[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }, [])

  const discard = useCallback(() => {
    setSelectedIds(new Set(baselineRef.current))
  }, [])

  const saveRef = useRef<() => Promise<void>>(async () => {})
  saveRef.current = async () => {
    if (!roleId || !canUpdate || !isDirty) return
    const add_permissions = [...selectedIds].filter((id) => !baselineRef.current.has(id))
    const remove_permissions = [...baselineRef.current].filter((id) => !selectedIds.has(id))
    await updateRole.mutateAsync({ roleId, data: { add_permissions, remove_permissions } })
    baselineRef.current = new Set(selectedIds)
  }
  const save = useCallback(() => saveRef.current(), [])

  return {
    permissions,
    selectedIds,
    isDirty,
    isSaving: updateRole.isPending,
    isLoading,
    error: error as Error | null,
    toggle,
    toggleMany,
    save,
    discard,
  }
}
