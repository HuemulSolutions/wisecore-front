import type { AuthType } from './core'

export interface CreateAuthTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Root admin (único eje de esta página, no existe recurso `auth_type` propio). Default `false`. */
  canManage?: boolean
}

export interface DeleteAuthTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  authType: AuthType | null
  /** Root admin (único eje de esta página, no existe recurso `auth_type` propio). Default `false`. */
  canManage?: boolean
}

export interface EditAuthTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  authType: AuthType | null
  /** Root admin (único eje de esta página, no existe recurso `auth_type` propio). Default `false`. */
  canManage?: boolean
}
