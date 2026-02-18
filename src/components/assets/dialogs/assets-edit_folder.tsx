"use client"

import * as React from "react"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Edit3 } from "lucide-react"
import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { editFolder } from "@/services/folders"
import { toast } from "sonner"
import { useOrganizationId } from "@/hooks/use-organization"
import NameDescriptionFields from "@/components/assets/content/name-description-fields"
import type { EditFolderDialogProps } from "@/types/assets"

export default function EditFolder({ 
  folderId, 
  currentName,
  onFolderEdited,
  open,
  onOpenChange
}: EditFolderDialogProps) {
  const [name, setName] = useState(currentName)

  // Reset name when currentName changes or dialog opens
  React.useEffect(() => {
    if (open) {
      setName(currentName)
    }
  }, [currentName, open])

  const selectedOrganizationId = useOrganizationId()
  
  const editFolderMutation = useMutation({
    mutationFn: async (newName: string) => {
      if (!selectedOrganizationId) {
        throw new Error('No organization selected');
      }
      return await editFolder(folderId, newName.trim(), selectedOrganizationId)
    },
    onSuccess: () => {
      toast.success(`Folder renamed to "${name.trim()}"`)
      onFolderEdited?.()
      onOpenChange(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error("Folder name cannot be empty")
      return
    }

    if (name.trim() === currentName) {
      toast.info("No changes made")
      onOpenChange(false)
      return
    }

    editFolderMutation.mutate(name.trim())
  }

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Folder"
      description={`Change the name of the folder "${currentName}".`}
      icon={Edit3}
      maxWidth="md"
      maxHeight="90vh"
      showDefaultFooter
      onCancel={() => onOpenChange(false)}
      submitLabel="Save Changes"
      cancelLabel="Cancel"
      isSubmitting={editFolderMutation.isPending}
      isValid={!!name.trim()}
      formId="edit-folder-form"
    >
      <form id="edit-folder-form" onSubmit={handleSubmit}>
        <NameDescriptionFields
          name={name}
          onNameChange={setName}
          nameLabel="Folder Name *"
          namePlaceholder="Enter folder name"
          disabled={editFolderMutation.isPending}
          includeDescription={false}
        />
      </form>
    </ReusableDialog>
  )
}