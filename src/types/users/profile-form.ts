/**
 * Formulario plano del tab "Perfil" — espejo de `RoleDetailsFormApi`
 * (`src/types/roles/details-form.ts`). Reemplaza a `EditUserSheet` en /users
 * para nombre/apellido/email(ro)/cumpleaños/foto. Status y root admin no
 * forman parte de este form: son acciones inmediatas del tab, ver
 * `UsersDetailProfileTabProps`.
 */
export interface UserProfileFormApi {
  name: string
  lastName: string
  email: string
  birthDay: string
  birthMonth: string
  /** Base64 de la foto recién elegida; "" = sin cambio. */
  photoFile: string
  setName: (v: string) => void
  setLastName: (v: string) => void
  setBirthDay: (v: string) => void
  setBirthMonth: (v: string) => void
  onFileChange: (files: FileList | null) => void
  errors: Record<string, string>
  /** Gate adicional para `HuemulPanelSaveBar` — `isDirty` sin errores de validación. */
  canSave: boolean
  isDirty: boolean
  isSaving: boolean
  save: () => Promise<void>
  discard: () => void
}
