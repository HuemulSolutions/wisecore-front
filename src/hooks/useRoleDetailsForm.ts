import { useCallback, useEffect, useRef, useState } from "react"
import { useRoles, useRoleMutations } from "@/hooks/useRbac"
import type { Role } from "@/services/rbac"
import type { RoleDetailsFormApi } from "@/types/roles/details-form"

interface RoleDetailsValues {
  name: string
  description: string
  isPosition: boolean
  parentRoleId: string | null
}

function valuesFromRole(role: Role): RoleDetailsValues {
  return {
    name: role.name || "",
    description: role.description || "",
    isPosition: Boolean(role.is_position),
    parentRoleId: role.parent_role_id ?? null,
  }
}

/**
 * Formulario plano del tab "Detalles" — ver `RoleDetailsFormApi`. Reemplaza
 * la mitad no-permisos de `EditRoleSheet`. Hidratación gateada por `isDirty`
 * (ia context/sheet-footer-batch-save-guide.md regla 3): el rol puede
 * refrescarse desde `rbacQueryKeys.roles` (ej. al guardar el tab Permisos)
 * mientras el usuario edita nombre/descripción acá.
 */
export function useRoleDetailsForm(role: Role | null, canUpdate: boolean): RoleDetailsFormApi {
  const [values, setValues] = useState<RoleDetailsValues>({
    name: "",
    description: "",
    isPosition: false,
    parentRoleId: null,
  })
  const baselineRef = useRef<RoleDetailsValues>(values)

  const { data: rolesResponse } = useRoles(canUpdate && !!role, 1, 1000)
  const { updateRole } = useRoleMutations()

  const isDirty =
    values.name !== baselineRef.current.name ||
    values.description !== baselineRef.current.description ||
    values.isPosition !== baselineRef.current.isPosition ||
    values.parentRoleId !== baselineRef.current.parentRoleId

  useEffect(() => {
    if (!role || isDirty) return
    const loaded = valuesFromRole(role)
    baselineRef.current = loaded
    setValues(loaded)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, isDirty])

  const positionRoleOptions = (rolesResponse?.data ?? [])
    .filter((r) => r.is_position && r.id !== role?.id)
    .map((r) => ({ id: r.id, name: r.name }))

  const discard = useCallback(() => {
    setValues(baselineRef.current)
  }, [])

  const saveRef = useRef<() => Promise<void>>(async () => {})
  saveRef.current = async () => {
    if (!role || !canUpdate || !isDirty) return
    const { name, description, isPosition, parentRoleId } = values
    const initialParentRoleId = baselineRef.current.parentRoleId
    const clearedParent = !isPosition || parentRoleId === null
    const shouldClearParent = clearedParent && initialParentRoleId !== null

    await updateRole.mutateAsync({
      roleId: role.id,
      data: {
        name,
        description,
        is_position: isPosition,
        ...(shouldClearParent
          ? { clear_parent_role: true }
          : { parent_role_id: isPosition ? parentRoleId : null }),
      },
    })
    baselineRef.current = { name, description, isPosition, parentRoleId }
  }
  const save = useCallback(() => saveRef.current(), [])

  return {
    name: values.name,
    description: values.description,
    isPosition: values.isPosition,
    parentRoleId: values.parentRoleId,
    positionRoleOptions,
    setName: (v) => setValues((prev) => ({ ...prev, name: v })),
    setDescription: (v) => setValues((prev) => ({ ...prev, description: v })),
    setIsPosition: (v) => setValues((prev) => ({ ...prev, isPosition: v, parentRoleId: v ? prev.parentRoleId : null })),
    setParentRoleId: (v) => setValues((prev) => ({ ...prev, parentRoleId: v })),
    isDirty,
    isSaving: updateRole.isPending,
    save,
    discard,
  }
}
