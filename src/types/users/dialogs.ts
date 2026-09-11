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

/**
 * Único consumidor: el sheet "Editar mi perfil" del menú de usuario
 * (`app-layout.tsx`, `canSave: true` siempre — editar el propio perfil no es
 * una acción sobre el recurso `user` de la organización). La edición inline
 * de OTRO usuario ya vive en `UsersDetailProfileTab` — ver `users.tsx` y
 * `global-admin-users-section.tsx`.
 */
export interface EditUserSheetProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  showDailyDigest?: boolean
  canSave: boolean
}

// `UserOrganizationsDialogProps`/`RootAdminDialogProps` se retiraron: ambas
// funciones (asignar organizaciones, switch de root admin) pasaron a ser
// inline en `UserDetailPanel` (tabs Organizaciones/Perfil) en `/users` y
// `/global-admin`.

export interface CreateUserSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (user: User) => void
  addToOrganization?: boolean
  canCreate: boolean
}
