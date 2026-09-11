import CreateUserSheet from "@/components/users/users-create-sheet"
import UserDeleteDialog from "@/components/users/users-delete-dialog"
import type { UserPageDialogsProps } from '@/types/users'
export type { UserPageDialogsProps } from '@/types/users'

/**
 * Contenedor sin lógica de permisos propia: cada consumidor resuelve sus
 * ejes con el suyo (`/users` vía usePageAccess('users'), `/global-admin` vía
 * su único `canManage` root-admin-only) y acá solo se propagan.
 *
 * Solo monta creación y eliminación: editar, asignar roles, el switch de
 * root admin y asignar organizaciones ya no viven acá — todo eso es inline
 * en `UserDetailPanel` (tabs Perfil/Roles/Organizaciones), en ambos
 * consumidores. Ver `users-detail-panel.tsx`.
 */
export default function UserPageDialogs({
  state,
  onCloseDialog,
  onUpdateState,
  userMutations,
  onUsersUpdated,
  createUserAddToOrganization,
  canCreate,
  canDelete,
}: UserPageDialogsProps) {
  return (
    <>
      <CreateUserSheet
        open={state.showCreateDialog}
        onOpenChange={(open) => !open && onUpdateState({ showCreateDialog: false })}
        onSuccess={onUsersUpdated}
        addToOrganization={createUserAddToOrganization}
        canCreate={canCreate}
      />

      <UserDeleteDialog
        user={state.deletingUser}
        open={!!state.deletingUser}
        onOpenChange={(open) => !open && onCloseDialog('deletingUser')}
        canDelete={canDelete}
        onAction={async () => {
          if (!canDelete || !state.deletingUser) return
          await new Promise<void>((resolve, reject) => {
            userMutations.deleteUser.mutate(state.deletingUser!.id, {
              onSuccess: () => resolve(),
              onError: (error) => reject(error)
            })
          })
        }}
      />
    </>
  )
}
