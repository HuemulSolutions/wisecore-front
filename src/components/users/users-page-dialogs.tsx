import EditUserSheet from "@/components/users/users-edit-sheet"
import UserOrganizationsDialog from "@/components/users/users-organizations-dialog"
import CreateUserSheet from "@/components/users/users-create-sheet"
import UserDeleteDialog from "@/components/users/users-delete-dialog"
import RootAdminDialog from "@/components/users/users-root-admin-dialog"
import type { UserPageDialogsProps } from '@/types/users'
export type { UserPageDialogsProps } from '@/types/users'

/**
 * Contenedor sin lógica de permisos propia: cada consumidor resuelve los cinco
 * ejes con el suyo (`/users` vía usePageAccess('users'), `/global-admin` vía su
 * único `canManage` root-admin-only) y acá solo se propagan.
 *
 * La asignación de roles ya no vive acá: `AssignRolesSheet` se eliminó, el
 * panel de detalle de `/users` (`UserDetailPanel` + `useUserRolesStaging`)
 * absorbe esa función con su propio staging.
 */
export default function UserPageDialogs({
  state,
  onCloseDialog,
  onUpdateState,
  userMutations,
  onUsersUpdated,
  createUserAddToOrganization,
  canCreate,
  canUpdate,
  canDelete,
  canManageRootAdmin,
  canManageOrganizations
}: UserPageDialogsProps) {
  return (
    <>
      <EditUserSheet
        user={state.editingUser}
        open={!!state.editingUser}
        onOpenChange={(open) => !open && onCloseDialog('editingUser')}
        onSuccess={onUsersUpdated}
        canSave={canUpdate}
      />

      <UserOrganizationsDialog
        user={state.organizationUser}
        open={!!state.organizationUser}
        onOpenChange={(open) => !open && onCloseDialog('organizationUser')}
        canManage={canManageOrganizations}
      />

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

      <RootAdminDialog
        user={state.rootAdminUser}
        open={!!state.rootAdminUser}
        onOpenChange={(open) => !open && onCloseDialog('rootAdminUser')}
        canManage={canManageRootAdmin}
        onConfirm={(userId, isRootAdmin) => {
          if (!canManageRootAdmin) return
          userMutations.updateRootAdmin.mutate(
            { userId, isRootAdmin },
            {
              onSuccess: () => {
                onCloseDialog('rootAdminUser')
              }
            }
          )
        }}
        isLoading={userMutations.updateRootAdmin.isPending}
      />
    </>
  )
}
