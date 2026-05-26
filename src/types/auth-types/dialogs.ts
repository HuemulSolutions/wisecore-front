import type { AuthType } from './core'

export interface CreateAuthTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface DeleteAuthTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  authType: AuthType | null
}

export interface EditAuthTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  authType: AuthType | null
}
