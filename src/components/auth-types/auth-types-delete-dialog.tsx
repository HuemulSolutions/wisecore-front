"use client"

import { useState } from "react"
import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog"
import { useAuthTypeMutations } from "@/hooks/useAuthTypes"
import type { AuthType } from "@/services/auth-types"

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
    <ReusableAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Are you sure?"
      description={`This action cannot be undone. This will permanently delete the authentication type "${authType?.name}".`}
      onConfirm={handleDelete}
      confirmLabel="Deleting"
      isProcessing={isDeleting}
    />
  )
}