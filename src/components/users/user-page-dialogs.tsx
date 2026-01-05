import { useState } from "react"
import EditUserDialog from "@/components/users/edit-user-dialog"
import UserOrganizationsDialog from "@/components/user-organizations-dialog"
import CreateUserDialog from "@/components/users/create-user-dialog"
import AssignRolesSheet from "@/components/assign-roles-sheet"
import UserDeleteDialog from "@/components/users/user-delete-dialog"
import { useUserMutations } from "@/hooks/useUsers"
import { type UserPageState } from "./types"

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
    </>
  )
}