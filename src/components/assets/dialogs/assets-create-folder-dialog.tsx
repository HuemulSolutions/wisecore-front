"use client"

import * as React from "react"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { createFolder } from "@/services/folders"
import { useOrganization } from "@/contexts/organization-context"
import { toast } from "sonner"
import type { CreateFolderRequest, CreateFolderDialogProps } from "@/types/assets"
import { HuemulField } from "@/huemul/components/huemul-field"

export function CreateFolderDialog({ open, onOpenChange, parentFolder, onFolderCreated }: CreateFolderDialogProps) {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useOrganization()
  const { t } = useTranslation('assets')
  const { t: tCommon } = useTranslation('common')
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
    meta: { successMessage: t('createFolder.success') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library", selectedOrganizationId] })
      onFolderCreated?.()
      onOpenChange(false)
    },
  })

  const handleCreate = () => {
    if (!selectedOrganizationId) {
      toast.error(t('createFolder.errorOrganizationRequired'))
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
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('createFolder.title')}
      description={t('createFolder.description')}
      icon={Plus}
      maxWidth="sm:max-w-lg"
      maxHeight="max-h-[90vh]"
      cancelLabel={tCommon('cancel')}
      saveAction={{
        label: t('createFolder.submitLabel'),
        onClick: handleCreate,
        disabled: !name.trim() || !selectedOrganizationId,
        loading: createFolderMutation.isPending,
        closeOnSuccess: false,
      }}
    >
      <HuemulField
        label={t('createFolder.folderName')}
        required
        value={name}
        onChange={(val) => setName(val as string)}
        placeholder={t('createFolder.folderNamePlaceholder')}
        disabled={createFolderMutation.isPending}
      />
    </HuemulDialog>
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