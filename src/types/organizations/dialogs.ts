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

// `EditOrganizationDialogProps`/`SetOrganizationAdminDialogProps` se
// retiraron: límites de sistema y "Hacer admin" pasaron a ser inline en
// `OrganizationDetailPanel` (tabs Detalles/Usuarios), en `/organizations` y
// `/global-admin`.
