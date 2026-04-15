"use client"

import * as React from "react"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { FileUp } from "lucide-react"
import { useTranslation } from "react-i18next"

import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField } from "@/huemul/components/huemul-field"
import { importDocumentFromFile } from "@/services/assets"
import { useOrganization } from "@/contexts/organization-context"
import { useRoleDocumentTypes } from "@/hooks/useRoleDocumentTypes"
import { toast } from "sonner"
import { ApiError } from "@/types/api-error"
import { handleApiError } from "@/lib/error-utils"
import { useOrgNavigate } from "@/hooks/useOrgRouter"

interface ImportAssetFromFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folderId?: string
  onAssetCreated?: (asset: { id: string; name: string; type: string }) => void
}

export function ImportAssetFromFileDialog({
  open,
  onOpenChange,
  folderId,
  onAssetCreated,
}: ImportAssetFromFileDialogProps) {
  const { selectedOrganizationId } = useOrganization()
  const queryClient = useQueryClient()
  const { t } = useTranslation('assets')
  const { t: tCommon } = useTranslation('common')
  const navigate = useOrgNavigate()

  const [name, setName] = useState("")
  const [internalCode, setInternalCode] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [documentTypeId, setDocumentTypeId] = useState("")
  const [forceImport, setForceImport] = useState(false)

  React.useEffect(() => {
    if (open) {
      setName("")
      setInternalCode("")
      setDescription("")
      setFile(null)
      setDocumentTypeId("")
      setForceImport(false)

      if (selectedOrganizationId) {
        queryClient.invalidateQueries({ queryKey: ['role-document-types'] })
      }
    }
  }, [open, selectedOrganizationId, queryClient])

  const { data: documentTypes = [], isLoading: isLoadingDocTypes, error: docTypesError } =
    useRoleDocumentTypes(open && !!selectedOrganizationId)

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrganizationId) throw new Error("Organization ID not found")
      if (!file) throw new Error("No file selected")
      return importDocumentFromFile({
        name: name.trim(),
        description: description.trim() || undefined,
        internal_code: internalCode.trim() || undefined,
        document_type_id: documentTypeId,
        folder_id: folderId ?? null,
        force_import: forceImport,
        file,
        organizationId: selectedOrganizationId,
      })
    },
    meta: { showSuccessToast: false },
    onError: (error) => {
      if (ApiError.isApiError(error) && error.code === 'DUPLICATE_DOCUMENT_CONTENT') {
        const detail = error.detail as unknown as { document_id?: string; document_name?: string }
        const docName = detail?.document_name ?? ''
        const docId = detail?.document_id
        toast.warning(t('importFromFile.errorDuplicateContent', { name: docName }), {
          action: docId
            ? {
                label: t('importFromFile.openExisting'),
                onClick: () => {
                  onOpenChange(false)
                  navigate(`/asset/${docId}`)
                },
              }
            : undefined,
          duration: 8000,
        })
        return
      }
      handleApiError(error)
    },
    onSuccess: (createdAsset) => {
      const assetId = createdAsset.id ?? createdAsset.document_id
      const assetName = createdAsset.name ?? createdAsset.document_name ?? name
      toast.success(t('importFromFile.success', { name: assetName }))
      onOpenChange(false)
      onAssetCreated?.({
        id: assetId,
        name: assetName,
        type: "document",
      })
    },
  })

  const handleImport = () => {
    if (!selectedOrganizationId) {
      toast.error(t('create.errorOrganizationRequired'))
      return
    }
    if (!name.trim()) {
      toast.error(t('importFromFile.errorNameRequired'))
      return
    }
    if (!file) {
      toast.error(t('importFromFile.errorFileRequired'))
      return
    }
    if (!documentTypeId) {
      toast.error(t('create.errorAssetTypeRequired'))
      return
    }
    importMutation.mutate()
  }

  const isValid = !!name.trim() && !!file && !!documentTypeId && !!selectedOrganizationId

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('importFromFile.title')}
      description={t('importFromFile.description')}
      icon={FileUp}
      maxWidth="sm:max-w-xl"
      cancelLabel={tCommon('cancel')}
      saveAction={{
        label: t('importFromFile.submitLabel'),
        onClick: handleImport,
        loading: importMutation.isPending,
        disabled: !isValid,
        closeOnSuccess: false,
      }}
    >
      <div className="grid gap-6">
        <HuemulField
          type="text"
          label={t('form.assetName')}
          name="name"
          required
          value={name}
          onChange={(v) => setName(String(v))}
          placeholder={t('form.assetNamePlaceholder')}
        />

        <HuemulField
          type="text"
          label={t('form.internalCode')}
          name="internalCode"
          value={internalCode}
          onChange={(v) => setInternalCode(String(v))}
          placeholder={t('form.internalCodePlaceholder')}
          description={t('form.internalCodeDescription')}
        />

        <HuemulField
          type="textarea"
          label={t('form.description')}
          name="description"
          value={description}
          onChange={(v) => setDescription(String(v))}
          placeholder={t('form.descriptionPlaceholder')}
          rows={3}
        />

        <HuemulField
          type="file"
          label={t('importFromFile.fileLabel')}
          name="file"
          required
          accept=".pdf,.docx,.txt,.md"
          onFileChange={(files) => setFile(files?.[0] ?? null)}
          description={t('importFromFile.fileDescription')}
        />

        <HuemulField
          type="select"
          label={t('form.assetType')}
          name="documentType"
          id="documentType"
          required
          value={documentTypeId}
          onChange={(v) => setDocumentTypeId(String(v))}
          options={documentTypes.map((dt: any) => ({ label: dt.name, value: dt.id, color: dt.color }))}
          placeholder={isLoadingDocTypes ? t('form.assetTypeLoading') : t('form.assetTypePlaceholder')}
          disabled={isLoadingDocTypes}
          error={docTypesError ? t('form.assetTypeError') : undefined}
        />

        <HuemulField
          type="switch"
          label={t('importFromFile.forceImportLabel')}
          name="forceImport"
          value={forceImport}
          onChange={(v) => setForceImport(Boolean(v))}
          description={t('importFromFile.forceImportDescription')}
        />
      </div>
    </HuemulDialog>
  )
}
