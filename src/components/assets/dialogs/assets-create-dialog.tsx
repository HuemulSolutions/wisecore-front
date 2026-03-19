"use client"

import * as React from "react"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { createDocument } from "@/services/assets"
import { getAllTemplates } from "@/services/templates"
import { useOrganization } from "@/contexts/organization-context"
import { useRoleDocumentTypes } from "@/hooks/useRoleDocumentTypes"
import { toast } from "sonner"
import CreateDocumentType from "@/components/assets-types/assets-types-create"
import type { CreateAssetRequest, CreateAssetDialogProps } from "@/types/assets"
import AssetFormFields from "@/components/assets/content/assets-form-fields"

function CreateAssetDialogInner({ open, onOpenChange, folderId, onAssetCreated }: CreateAssetDialogProps) {
  const { selectedOrganizationId } = useOrganization()
  const queryClient = useQueryClient()
  const { t } = useTranslation('assets')
  const { t: tCommon } = useTranslation('common')
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [internalCode, setInternalCode] = useState("")
  const [documentTypeId, setDocumentTypeId] = useState("")
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
      setTemplateId("")
      setCreateInitialVersion(false)
      
      // Refresh document types when dialog opens to ensure latest data
      if (selectedOrganizationId) {
        queryClient.invalidateQueries({ queryKey: ['role-document-types'] })
        queryClient.invalidateQueries({ queryKey: ['document-types'] })
      }
    }
  }, [open, selectedOrganizationId, queryClient])

  // Fetch document types based on current user's role - solo cuando el diálogo esté abierto
  const { data: documentTypes = [], isLoading: isLoadingDocTypes, error: docTypesError } = useRoleDocumentTypes(open && !!selectedOrganizationId)

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ['templates', selectedOrganizationId],
    queryFn: () => getAllTemplates(selectedOrganizationId!),
    enabled: !!selectedOrganizationId && open,
  })

  // Handle new document type creation
  const handleNewDocumentTypeCreated = (newDocType: { id: string; name: string; color: string }) => {
    // Auto-select the newly created document type
    setDocumentTypeId(newDocType.id)
    
    // Invalidate and refetch document types to include the new one
    queryClient.invalidateQueries({ queryKey: ['role-document-types'] })
    queryClient.invalidateQueries({ queryKey: ['document-types'] })
    
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
    onSuccess: (createdAsset) => {
      console.log('✅ [CREATE-DIALOG] Asset created successfully:', createdAsset)
      toast.success(t('create.success'))
      
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
    onError: (error: any) => {
      console.error("Create asset error:", error)
      
      // Extract error message from response
      const errorMessage = error?.response?.data?.error || 
                          error?.message || 
                          t('create.errorFailed')
      
      toast.error(errorMessage)
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
            templates={templates}
            documentTypes={documentTypes}
            isLoadingDocTypes={isLoadingDocTypes}
            docTypesError={docTypesError}
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