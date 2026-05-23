import type { AuthType } from '@/services/auth-types'

export interface EditAuthTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  authType: AuthType | null
}
