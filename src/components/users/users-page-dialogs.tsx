import EditUserSheet from "@/components/users/users-edit-sheet"
import UserOrganizationsDialog from "@/components/users/users-organizations-dialog"
import CreateUserDialog from "@/components/users/users-create-dialog"
import AssignRolesSheet from "@/components/roles/roles-assign-sheet"
import UserDeleteDialog from "@/components/users/users-delete-dialog"
import RootAdminDialog from "@/components/users/users-root-admin-dialog"
import { logger } from "@/lib/logger"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import type { UserPageDialogsProps } from '@/types/users'
export type { UserPageDialogsProps } from '@/types/users'

export default function UserPageDialogs({
  state,
  onCloseDialog,
  onUpdateState,
  userMutations,
  onUsersUpdated,
  createUserAddToOrganization
}: UserPageDialogsProps) {
  const { isOrgAdmin, hasPermission } = useUserPermissions()
  // TODO(rbac-audit): /users todavía no tiene su propia pasada de auditoría
  // (ver ia context/rbac-audit-guide.md, 14ª pasada de /roles). AssignRolesSheet
  // muta vía RBAC_PAGES.roles.features.assignRoleToUsers = "rbac:u", así que se
  // resuelve acá con el mismo permiso hasta que /users tenga su matriz propia.
  const canAssignRoles = isOrgAdmin || hasPermission('rbac:u')

  return (
    <>
      <EditUserSheet
        user={state.editingUser}
        open={!!state.editingUser}
        onOpenChange={(open) => !open && onCloseDialog('editingUser')}
        onSuccess={onUsersUpdated}
      />

      <UserOrganizationsDialog
        user={state.organizationUser}
        open={!!state.organizationUser}
        onOpenChange={(open) => !open && onCloseDialog('organizationUser')}
      />

      <CreateUserDialog
        open={state.showCreateDialog}
        onOpenChange={(open) => !open && onUpdateState({ showCreateDialog: false })}
        onSuccess={onUsersUpdated}
        addToOrganization={createUserAddToOrganization}
      />

      <AssignRolesSheet
        user={state.assigningRoleUser}
        open={!!state.assigningRoleUser}
        onOpenChange={(open) => !open && onCloseDialog('assigningRoleUser')}
        onSuccess={() => {
          logger.log('Roles assigned successfully, users list will be refreshed')
        }}
        canAssign={canAssignRoles}
      />

      <UserDeleteDialog
        user={state.deletingUser}
        open={!!state.deletingUser}
        onOpenChange={(open) => !open && onCloseDialog('deletingUser')}
        onAction={async () => {
          if (!state.deletingUser) return
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
        onConfirm={(userId, isRootAdmin) => {
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
