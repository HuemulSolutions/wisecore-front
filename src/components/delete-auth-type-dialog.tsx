"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuthTypeMutations } from "@/hooks/useAuthTypes"
import type { AuthType } from "@/services/auth-types"

interface DeleteAuthTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  authType: AuthType | null
}

export function DeleteAuthTypeDialog({ open, onOpenChange, authType }: DeleteAuthTypeDialogProps) {
  const { deleteAuthType } = useAuthTypeMutations()

  const handleDelete = () => {
    if (!authType) return

    deleteAuthType.mutate(authType.id, {
      onSuccess: () => {
        onOpenChange(false)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the authentication type "{authType?.name}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="hover:cursor-pointer">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteAuthType.isPending}
            className="bg-destructive hover:bg-destructive/90 hover:cursor-pointer"
          >
            {deleteAuthType.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}