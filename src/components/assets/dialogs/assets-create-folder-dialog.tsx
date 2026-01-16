"use client"

import * as React from "react"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"

import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { createFolder } from "@/services/folders"
import { useOrganization } from "@/contexts/organization-context"
import { toast } from "sonner"
import type { CreateFolderRequest, CreateFolderDialogProps } from "@/types/assets"
import NameDescriptionFields from "@/components/assets/content/name-description-fields"

export function CreateFolderDialog({ open, onOpenChange, parentFolder, onFolderCreated }: CreateFolderDialogProps) {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useOrganization()
  const [name, setName] = useState("")

  React.useEffect(() => {
    if (open) {
      setName("")
    }
  }, [open])

  const createFolderMutation = useMutation({
    mutationFn: async (data: CreateFolderRequest) => {
      if (!selectedOrganizationId) throw new Error("Organization ID not found")
      return createFolder(data.name, data.organization_id, data.parent_folder_id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library", selectedOrganizationId] })
      onFolderCreated?.()
      toast.success("Folder created successfully")
      onOpenChange(false)
    },
    onError: (error) => {
      console.error("Create folder error:", error)
      toast.error("Failed to create folder")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedOrganizationId) {
      toast.error("Organization is required")
      return
    }

    const folderData: CreateFolderRequest = {
      name: name.trim(),
      organization_id: selectedOrganizationId,
    }
    
    if (parentFolder) {
      folderData.parent_folder_id = parentFolder
    }

    createFolderMutation.mutate(folderData)
  }

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Folder"
      description="Enter the folder name to create a new folder."
      icon={Plus}
      maxWidth="lg"
      showDefaultFooter
      onCancel={() => onOpenChange(false)}
      submitLabel="Create Folder"
      cancelLabel="Cancel"
      isSubmitting={createFolderMutation.isPending}
      isValid={!!name.trim() && !!selectedOrganizationId}
      formId="create-folder-form"
    >
      <form id="create-folder-form" onSubmit={handleSubmit}>
        <NameDescriptionFields
          name={name}
          onNameChange={setName}
          nameLabel="Folder Name *"
          namePlaceholder="Enter folder name"
          disabled={createFolderMutation.isPending}
          includeDescription={false}
        />
      </form>
    </ReusableDialog>
  )
}

// Legacy wrapper component for backward compatibility
interface CreateFolderLegacyProps {
  trigger: React.ReactNode;
  parentFolder?: string;
  onFolderCreated?: () => void;
}

export default function CreateFolder({ trigger, parentFolder, onFolderCreated }: CreateFolderLegacyProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger}
      </div>
      <CreateFolderDialog
        open={open}
        onOpenChange={setOpen}
        parentFolder={parentFolder}
        onFolderCreated={onFolderCreated}
      />
    </>
  )
}