import type { User } from '@/types/users'

export interface AssignRolesSheetProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}
