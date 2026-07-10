"use client"

import * as React from "react"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { createFolder } from "@/services/folders"
import { useOrganization } from "@/contexts/organization-context"
import { toast } from "sonner"
import type { CreateFolderRequest, CreateFolderSheetProps } from "@/types/assets"
import { HuemulField } from "@/huemul/components/huemul-field"

export function CreateFolderSheet({ open, onOpenChange, parentFolder, onFolderCreated }: CreateFolderSheetProps) {
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
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('createFolder.title')}
      description={t('createFolder.description')}
      icon={Plus}
      side="right"
      maxWidth="sm:max-w-lg"
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
    </HuemulSheet>
  )
}

// Legacy wrapper component for backward compatibility
import type { CreateFolderLegacyProps } from '@/types/assets'
export type { CreateFolderLegacyProps } from '@/types/assets'

export default function CreateFolder({ trigger, parentFolder, onFolderCreated }: CreateFolderLegacyProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger}
      </div>
      <CreateFolderSheet
        open={open}
        onOpenChange={setOpen}
        parentFolder={parentFolder}
        onFolderCreated={onFolderCreated}
      />
    </>
  )
}