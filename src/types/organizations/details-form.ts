/**
 * Formulario plano del tab "Detalles" del panel de organización (nombre,
 * descripción, y opcionalmente límites de sistema). Reemplaza a
 * `EditOrganizationDialog` en ambos consumidores (`/organizations` y
 * `/global-admin`). Mismo patrón `use<X>Form` que `RoleDetailsFormApi` — ver
 * ia context/sheet-footer-batch-save-guide.md.
 */
export interface OrganizationDetailsFormApi {
  name: string
  description: string
  setName: (v: string) => void
  setDescription: (v: string) => void
  /**
   * Límites de sistema (`max_users`/`token_limit`) — solo trackeados y
   * enviados cuando el hook se instancia con `manageSystemLimits: true`
   * (root-admin, `/global-admin`). En `/organizations` quedan en `null` y no
   * se renderizan ni se envían en el PATCH.
   */
  maxUsers: number | null
  tokenLimit: number | null
  setMaxUsers: (v: number | null) => void
  setTokenLimit: (v: number | null) => void
  /** Gate adicional para `HuemulPanelSaveBar` — `isDirty` sin nombre vacío. */
  canSave: boolean
  isDirty: boolean
  isSaving: boolean
  nameError: string | null
  save: () => Promise<void>
  discard: () => void
}
