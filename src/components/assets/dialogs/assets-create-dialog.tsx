"use client"

import * as React from "react"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { createDocument } from "@/services/assets"
import { getAllTemplates } from "@/services/templates"
import { getDocumentTypesWithInfo } from "@/services/role-document-type"
import { useOrganization } from "@/contexts/organization-context"
import type { FetchOptionsParams } from "@/huemul/components/huemul-field"
import { toast } from "sonner"
import CreateDocumentType from "@/components/assets-types/assets-types-create"
import type { CreateAssetRequest, CreateAssetDialogProps } from "@/types/assets"
import AssetFormFields from "@/components/assets/content/assets-form-fields"

function CreateAssetDialogInner({ open, onOpenChange, folderId, onAssetCreated }: CreateAssetDialogProps) {
  const { selectedOrganizationId } = useOrganization()
  const { t } = useTranslation('assets')
  const { t: tCommon } = useTranslation('common')
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [internalCode, setInternalCode] = useState("")
  const [documentTypeId, setDocumentTypeId] = useState("")
  const [docTypeLabel, setDocTypeLabel] = useState("")
  const [docTypeColor, setDocTypeColor] = useState<string | undefined>(undefined)
  const [templateId, setTemplateId] = useState("")
  const [createInitialVersion, setCreateInitialVersion] = useState(false)
  const [showCreateDocTypeDialog, setShowCreateDocTypeDialog] = useState(false)

  React.useEffect(() => {
    console.log('🔔 [CREATE-DIALOG] Open state changed:', open)
    if (open) {
      setName("")
      setDescription("")
      setInternalCode("")
      setDocumentTypeId("")
      setDocTypeLabel("")
      setDocTypeColor(undefined)
      setTemplateId("")
      setCreateInitialVersion(false)
    }
  }, [open, selectedOrganizationId])

  // Async fetch for templates
  const fetchTemplateOptions = React.useCallback(
    async ({ search, page, pageSize }: FetchOptionsParams) => {
      if (!selectedOrganizationId) return { options: [], hasMore: false }
      const res = await getAllTemplates(selectedOrganizationId, search, page, pageSize)
      return {
        options: res.data.map((t) => ({ value: t.id, label: t.name })),
        hasMore: res.has_next,
        totalCount: res.total,
      }
    },
    [selectedOrganizationId],
  )

  // Async fetch for document types (pagination only — endpoint has no search support)
  const fetchDocumentTypeOptions = React.useCallback(
    async ({ page, pageSize }: FetchOptionsParams) => {
      const res = await getDocumentTypesWithInfo(page, pageSize)
      return {
        options: res.data.map(dt => ({ value: dt.id, label: dt.name, color: dt.color })),
        hasMore: res.has_next,
      }
    },
    [],
  )

  // Handle new document type creation
  const handleNewDocumentTypeCreated = (newDocType: { id: string; name: string; color: string }) => {
    // Auto-select the newly created document type
    setDocumentTypeId(newDocType.id)
    setDocTypeLabel(newDocType.name)
    setDocTypeColor(newDocType.color)
    
    toast.success(t('create.assetTypeCreatedAndSelected', { name: newDocType.name }))
  }

  // Handle document type dialog close
  const handleDocumentTypeDialogClose = (open: boolean) => {
    setShowCreateDocTypeDialog(open)
    // Don't let the close event bubble up to parent dialog
    if (!open) {
      // Force focus back to document type select to prevent parent dialog from closing
      setTimeout(() => {
        const selectTrigger = document.querySelector('[id="documentType"]')
        if (selectTrigger) {
          (selectTrigger as HTMLElement).focus()
        }
      }, 100)
    }
  }

  const createAssetMutation = useMutation({
    mutationFn: async (data: CreateAssetRequest) => {
      if (!selectedOrganizationId) throw new Error("Organization ID not found")
      console.log('🚀 [CREATE-DIALOG] Starting asset creation:', data.name)
      return createDocument(data, selectedOrganizationId)
    },
    meta: { successMessage: t('create.success') },
    onSuccess: (createdAsset) => {
      console.log('✅ [CREATE-DIALOG] Asset created successfully:', createdAsset)
      
      // Close dialog first
      console.log('🚪 [CREATE-DIALOG] Closing dialog')
      onOpenChange(false)
      
      // Execute callback immediately — the dialog is protected against
      // re-render flashes via React.memo, so navigation won't cause
      // the portal to flicker.
      console.log('📞 [CREATE-DIALOG] Calling onAssetCreated callback')
      onAssetCreated?.({
        id: createdAsset.id,
        name: createdAsset.name,
        type: "document"
      })
    },
  })

  const handleCreate = () => {
    if (!selectedOrganizationId) {
      toast.error(t('create.errorOrganizationRequired'))
      return
    }

    if (!documentTypeId) {
      toast.error(t('create.errorAssetTypeRequired'))
      return
    }

    const assetData: CreateAssetRequest = {
      name: name.trim(),
      description: description.trim(),
      document_type_id: documentTypeId,
    }
    
    if (internalCode.trim()) {
      assetData.internal_code = internalCode.trim()
    }
    
    if (templateId) {
      assetData.template_id = templateId
    }
    
    if (folderId) {
      assetData.folder_id = folderId
    }

    // Only send create_initial_version when true and no template is selected
    if (createInitialVersion && !templateId) {
      assetData.create_initial_version = true
    }

    createAssetMutation.mutate(assetData)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleCreate()
  }

  return (
    <>
      <HuemulDialog
        open={open}
        onOpenChange={onOpenChange}
        title={t('create.title')}
        description={t('create.description')}
        icon={Plus}
        maxWidth="sm:max-w-2xl"
        maxHeight="max-h-[90vh]"
        cancelLabel={tCommon('cancel')}
        saveAction={{
          label: t('create.submitLabel'),
          onClick: handleCreate,
          loading: createAssetMutation.isPending,
          disabled: !name.trim() || !documentTypeId || !selectedOrganizationId,
          closeOnSuccess: false,
        }}
      >
        <form id="create-asset-form" onSubmit={handleSubmit}>
          <AssetFormFields
            name={name}
            description={description}
            internalCode={internalCode}
            templateId={templateId}
            documentTypeId={documentTypeId}
            createInitialVersion={createInitialVersion}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onInternalCodeChange={setInternalCode}
            onTemplateIdChange={setTemplateId}
            onDocumentTypeIdChange={setDocumentTypeId}
            onCreateInitialVersionChange={setCreateInitialVersion}
            onCreateDocType={() => setShowCreateDocTypeDialog(true)}
            fetchTemplateOptions={fetchTemplateOptions}
            fetchDocumentTypeOptions={fetchDocumentTypeOptions}
            selectedDocTypeLabel={docTypeLabel}
            selectedDocTypeColor={docTypeColor}
            disabled={createAssetMutation.isPending}
          />
        </form>
      </HuemulDialog>
      
      {/* Create Document Type Dialog */}
      {showCreateDocTypeDialog && (
        <CreateDocumentType
          trigger={<div />} // Empty trigger since we control it programmatically  
          open={showCreateDocTypeDialog}
          onOpenChange={handleDocumentTypeDialogClose}
          onDocumentTypeCreated={handleNewDocumentTypeCreated}
        />
      )}
    </>
  )
}

export const CreateAssetDialog = React.memo(CreateAssetDialogInner)