import type { AuthType } from '@/services/auth-types'

export interface DeleteAuthTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  authType: AuthType | null
}
