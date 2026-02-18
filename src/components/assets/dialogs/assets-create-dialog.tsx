"use client"

import * as React from "react"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"

import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { createDocument } from "@/services/assets"
import { getAllTemplates } from "@/services/templates"
import { useOrganization } from "@/contexts/organization-context"
import { useRoleDocumentTypes } from "@/hooks/useRoleDocumentTypes"
import { toast } from "sonner"
import CreateDocumentType from "@/components/assets-types/assets-types-create"
import type { CreateAssetRequest, CreateAssetDialogProps } from "@/types/assets"
import AssetFormFields from "@/components/assets/content/assets-form-fields"

export function CreateAssetDialog({ open, onOpenChange, folderId, onAssetCreated }: CreateAssetDialogProps) {
  const { selectedOrganizationId } = useOrganization()
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [internalCode, setInternalCode] = useState("")
  const [documentTypeId, setDocumentTypeId] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [showCreateDocTypeDialog, setShowCreateDocTypeDialog] = useState(false)

  React.useEffect(() => {
    console.log('🔔 [CREATE-DIALOG] Open state changed:', open)
    if (open) {
      setName("")
      setDescription("")
      setInternalCode("")
      setDocumentTypeId("")
      setTemplateId("")
      
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
    
    toast.success(`Asset type "${newDocType.name}" created and selected`)
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
      toast.success("Asset created successfully")
      
      // Close dialog and execute callback immediately
      // Radix will handle the unmounting and animation properly
      console.log('🚪 [CREATE-DIALOG] Closing dialog')
      onOpenChange(false)
      
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
                          "Failed to create asset"
      
      toast.error(errorMessage)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedOrganizationId) {
      toast.error("Organization is required")
      return
    }

    if (!documentTypeId) {
      toast.error("Asset type is required")
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

    createAssetMutation.mutate(assetData)
  }

  return (
    <>
      <ReusableDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Create Asset"
        description="Enter the asset information to create a new document."
        icon={Plus}
        maxWidth="lg"
        maxHeight="90vh"
        showDefaultFooter
        onCancel={() => onOpenChange(false)}
        submitLabel="Create Asset"
        cancelLabel="Cancel"
        isSubmitting={createAssetMutation.isPending}
        isValid={!!name.trim() && !!documentTypeId && !!selectedOrganizationId}
        formId="create-asset-form"
      >
        <form id="create-asset-form" onSubmit={handleSubmit}>
          <AssetFormFields
            name={name}
            description={description}
            internalCode={internalCode}
            templateId={templateId}
            documentTypeId={documentTypeId}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onInternalCodeChange={setInternalCode}
            onTemplateIdChange={setTemplateId}
            onDocumentTypeIdChange={setDocumentTypeId}
            onCreateDocType={() => setShowCreateDocTypeDialog(true)}
            templates={templates}
            documentTypes={documentTypes}
            isLoadingDocTypes={isLoadingDocTypes}
            docTypesError={docTypesError}
            disabled={createAssetMutation.isPending}
          />
        </form>
      </ReusableDialog>
      
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