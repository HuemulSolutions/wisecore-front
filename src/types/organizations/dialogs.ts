import type { Organization } from './table'

export interface CreateOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string; description?: string }) => void
  isPending: boolean
  /** Sin default: cada call-site debe declarar explícitamente su eje de permiso. */
  canCreate: boolean
}

export interface DeleteOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization: Organization | null
  onConfirm: () => Promise<void>
  /** Sin default: cada call-site debe declarar explícitamente su eje de permiso. */
  canDelete: boolean
}

export interface EditOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization: Organization | null
  onSave: () => void
  isSaving: boolean
  onOrgChange: (org: Organization) => void
  /** Sin default: cada call-site debe declarar explícitamente su eje de permiso. */
  canSave: boolean
  /**
   * No es un eje de RBAC ni un bypass: solo decide si se muestran/editan los
   * límites de sistema (`max_users`/`token_limit`), que no son org-scoped.
   */
  canManageSystemLimits?: boolean
}

export interface SetOrganizationAdminDialogProps {
  organization: Organization | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  /** Sin default: cada call-site debe declarar explícitamente su eje de permiso. */
  canSetAdmin: boolean
}
