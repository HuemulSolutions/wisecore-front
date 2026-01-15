import { useState } from "react"
import EditUserDialog from "@/components/users/users-edit-dialog"
import UserOrganizationsDialog from "@/components/users/users-organizations-dialog"
import CreateUserDialog from "@/components/users/users-create-dialog"
import AssignRolesSheet from "@/components/roles/roles-assign-sheet"
import UserDeleteDialog from "@/components/users/users-delete-dialog"
import RootAdminDialog from "@/components/users/users-root-admin-dialog"
import { useUserMutations } from "@/hooks/useUsers"
import { type UserPageState } from "@/types/users"

interface UserPageDialogsProps {
  state: UserPageState
  onCloseDialog: (dialog: keyof UserPageState) => void
  onUpdateState: (updates: Partial<UserPageState>) => void
  userMutations: ReturnType<typeof useUserMutations>
}

export default function UserPageDialogs({ 
  state, 
  onCloseDialog, 
  onUpdateState, 
  userMutations 
}: UserPageDialogsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  return (
    <>
      <EditUserDialog
        user={state.editingUser}
        open={!!state.editingUser}
        onOpenChange={(open) => !open && onCloseDialog('editingUser')}
      />

      <UserOrganizationsDialog
        user={state.organizationUser}
        open={!!state.organizationUser}
        onOpenChange={(open) => !open && onCloseDialog('organizationUser')}
      />

      <CreateUserDialog
        open={state.showCreateDialog}
        onOpenChange={(open) => !open && onUpdateState({ showCreateDialog: false })}
      />

      <AssignRolesSheet
        user={state.assigningRoleUser}
        open={!!state.assigningRoleUser}
        onOpenChange={(open) => !open && onCloseDialog('assigningRoleUser')}
        onSuccess={() => {
          console.log('Roles assigned successfully, users list will be refreshed')
        }}
      />

      <UserDeleteDialog
        user={state.deletingUser}
        open={!!state.deletingUser}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            onCloseDialog('deletingUser')
          }
        }}
        onConfirm={async (user) => {
          setIsDeleting(true)
          
          // Crear una promesa con delay mínimo de 800ms
          const minDelay = new Promise(resolve => setTimeout(resolve, 800))
          
          try {
            // Ejecutar la mutación y esperar ambas promesas
            await Promise.all([
              new Promise<void>((resolve, reject) => {
                userMutations.deleteUser.mutate(user.id, {
                  onSuccess: () => resolve(),
                  onError: (error) => reject(error)
                })
              }),
              minDelay
            ])
          } finally {
            setIsDeleting(false)
            onCloseDialog('deletingUser')
          }
        }}
        isDeleting={isDeleting}
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