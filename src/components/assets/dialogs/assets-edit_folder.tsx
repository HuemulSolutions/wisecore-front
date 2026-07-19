"use client"

import * as React from "react"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Edit3 } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { editFolder } from "@/services/folders"
import { toast } from "sonner"
import { handleApiError } from "@/lib/error-utils"
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
  const { t } = useTranslation(["assets", "common"])

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
    meta: { showSuccessToast: false },
    onSuccess: () => {
      toast.success(t('editFolder.renameSuccess', { name: name.trim() }))
      onFolderEdited?.()
      onOpenChange(false)
    },
    onError: (error) => {
      handleApiError(error, {
        onErrorCode: (code) => {
          const key: Record<string, string> = {
            FOLDER_NOT_RENAMABLE: 'editFolder.notRenamableError',
            FOLDER_ADMINISTER_REQUIRED: 'editFolder.administerRequiredError',
            ORG_ADMIN_REQUIRED: 'editFolder.orgAdminRequiredError',
          }
          const messageKey = key[code]
          if (!messageKey) return false
          toast.error(t(messageKey))
          return true
        },
      })
    },
  })

  const handleSubmit = () => {
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
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('editFolder.title')}
      description={t('editFolder.description', { name: currentName })}
      icon={Edit3}
      maxWidth="sm:max-w-md"
      maxHeight="max-h-[90vh]"
      cancelLabel={t('common:cancel')}
      saveAction={{
        label: t('editFolder.submitLabel'),
        onClick: handleSubmit,
        disabled: !name.trim(),
        loading: editFolderMutation.isPending,
        closeOnSuccess: false,
      }}
    >
      <NameDescriptionFields
        name={name}
        onNameChange={setName}
        nameLabel={t('editFolder.nameLabel')}
        namePlaceholder={t('editFolder.namePlaceholder')}
        disabled={editFolderMutation.isPending}
        includeDescription={false}
      />
    </HuemulDialog>
  )
}