"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useAuthTypeMutations } from "@/hooks/useAuthTypes"
import type { AuthType } from "@/services/auth-types"
import { Loader2 } from "lucide-react"

interface DeleteAuthTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  authType: AuthType | null
}

export function DeleteAuthTypeDialog({ open, onOpenChange, authType }: DeleteAuthTypeDialogProps) {
  const { deleteAuthType } = useAuthTypeMutations()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!authType) return

    setIsDeleting(true)
    const minDelay = new Promise(resolve => setTimeout(resolve, 800))

    try {
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          deleteAuthType.mutate(authType.id, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error)
          })
        }),
        minDelay
      ])
    } finally {
      setIsDeleting(false)
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(open) => {
      if (!open && !isDeleting) {
        onOpenChange(open)
      }
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the authentication type "{authType?.name}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            className="bg-destructive hover:bg-destructive/90 hover:cursor-pointer"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}