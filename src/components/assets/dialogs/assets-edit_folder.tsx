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
import { useTranslation } from "react-i18next"

export default function EditFolder({ 
  folderId, 
  currentName,
  onFolderEdited,
  open,
  onOpenChange
}: EditFolderDialogProps) {
  const [name, setName] = useState(currentName)
  const { t } = useTranslation('assets')

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
      toast.success(t('editFolder.renameSuccess', { name: name.trim() }))
      onFolderEdited?.()
      onOpenChange(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error(t('editFolder.emptyNameError'))
      return
    }

    if (name.trim() === currentName) {
      toast.info(t('editFolder.noChanges'))
      onOpenChange(false)
      return
    }

    editFolderMutation.mutate(name.trim())
  }

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('editFolder.title')}
      description={t('editFolder.description', { name: currentName })}
      icon={Edit3}
      maxWidth="md"
      maxHeight="90vh"
      showDefaultFooter
      onCancel={() => onOpenChange(false)}
      submitLabel={t('editFolder.submitLabel')}
      cancelLabel={t('editFolder.cancelLabel')}
      isSubmitting={editFolderMutation.isPending}
      isValid={!!name.trim()}
      formId="edit-folder-form"
    >
      <form id="edit-folder-form" onSubmit={handleSubmit}>
        <NameDescriptionFields
          name={name}
          onNameChange={setName}
          nameLabel={t('editFolder.nameLabel')}
          namePlaceholder={t('editFolder.namePlaceholder')}
          disabled={editFolderMutation.isPending}
          includeDescription={false}
        />
      </form>
    </ReusableDialog>
  )
}