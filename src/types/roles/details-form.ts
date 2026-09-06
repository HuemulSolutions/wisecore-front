/**
 * Formulario plano del tab "Detalles" del panel de rol (nombre, descripción,
 * jerarquía de cargos). Reemplaza a `EditRoleSheet` para esos campos — los
 * permisos son propiedad exclusiva de `RolePermissionsStagingApi`. Mismo
 * patrón `use<X>Form` que `useAssetTypeGeneralForm` — ver
 * ia context/sheet-footer-batch-save-guide.md.
 */
export interface RoleDetailsFormApi {
  name: string
  description: string
  isPosition: boolean
  parentRoleId: string | null
  /** Roles de cargo disponibles como padre — ya excluye el rol en edición. */
  positionRoleOptions: { id: string; name: string }[]
  setName: (v: string) => void
  setDescription: (v: string) => void
  setIsPosition: (v: boolean) => void
  setParentRoleId: (v: string | null) => void
  isDirty: boolean
  isSaving: boolean
  save: () => Promise<void>
  discard: () => void
}
