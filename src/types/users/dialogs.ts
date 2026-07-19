import type { User } from './core'

export interface UserDeleteDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction: () => Promise<void>
}

export interface EditUserSheetProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  showDailyDigest?: boolean
}

export interface UserOrganizationsDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface RootAdminDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (userId: string, isRootAdmin: boolean) => void
  isLoading?: boolean
}

export interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  addToOrganization?: boolean
}
