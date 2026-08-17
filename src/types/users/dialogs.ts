import type { User } from './core'

/**
 * Todas las props `can*` de este archivo son **obligatorias** (sin default):
 * cada uno de estos diálogos muta y ninguno tenía gate propio — dependían al
 * 100% de que su trigger no se renderizara. Omitirlas rompe el build en vez de
 * reabrir el hueco en silencio. Ver `ia context/rbac-audit-guide.md`.
 */

export interface UserDeleteDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction: () => Promise<void>
  canDelete: boolean
}

export interface EditUserSheetProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  showDailyDigest?: boolean
  canSave: boolean
}

export interface UserOrganizationsDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canManage: boolean
}

export interface RootAdminDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (userId: string, isRootAdmin: boolean) => void
  isLoading?: boolean
  canManage: boolean
}

export interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  addToOrganization?: boolean
  canCreate: boolean
}
