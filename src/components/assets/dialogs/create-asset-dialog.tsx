"use client"

import * as React from "react"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createDocument } from "@/services/documents"
import { getAllTemplates } from "@/services/templates"
import { useOrganization } from "@/contexts/organization-context"
import { useRoleDocumentTypes } from "@/hooks/useRoleDocumentTypes"
import { isRootAdmin } from "@/lib/jwt-utils"
import { toast } from "sonner"
import CreateDocumentType from "@/components/create_doc_type"

interface CreateAssetRequest {
  name: string;
  description: string;
  document_type_id: string;
  template_id?: string;
  folder_id?: string;
}

interface CreateAssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folderId?: string;
  onAssetCreated?: (asset: { id: string; name: string; type: "document" }) => void;
}

export function CreateAssetDialog({ open, onOpenChange, folderId, onAssetCreated }: CreateAssetDialogProps) {
  const { selectedOrganizationId } = useOrganization()
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [documentTypeId, setDocumentTypeId] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [showCreateDocTypeDialog, setShowCreateDocTypeDialog] = useState(false)

  React.useEffect(() => {
    if (open) {
      setName("")
      setDescription("")
      setDocumentTypeId("")
      setTemplateId("")
      
      // Refresh document types when dialog opens to ensure latest data
      if (selectedOrganizationId) {
        queryClient.invalidateQueries({ queryKey: ['role-document-types'] })
        queryClient.invalidateQueries({ queryKey: ['document-types'] })
      }
    }
  }, [open, selectedOrganizationId, queryClient])

  // Fetch document types based on current user's role
  const { data: documentTypes = [], isLoading: isLoadingDocTypes, error: docTypesError } = useRoleDocumentTypes(open)

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
      return createDocument(data, selectedOrganizationId)
    },
    onSuccess: (createdAsset) => {
      onAssetCreated?.({
        id: createdAsset.id,
        name: createdAsset.name,
        type: "document"
      })
      toast.success("Asset created successfully")
      onOpenChange(false)
    },
    onError: (error) => {
      console.error("Create asset error:", error)
      toast.error("Failed to create asset")
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
    
    if (templateId) {
      assetData.template_id = templateId
    }
    
    if (folderId) {
      assetData.folder_id = folderId
    }

    createAssetMutation.mutate(assetData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create Asset
          </DialogTitle>
          <DialogDescription>
            Enter the asset information to create a new document.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Asset Name *</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter asset name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter asset description"
                rows={4}
              />
            </div>        
            <div className="grid gap-2">
              <Label htmlFor="template">Template (Optional)</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger id="template" className="w-full">
                  <SelectValue placeholder="Select template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {templates.length > 0 ? (
                    templates.map((template: any) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-2 text-sm text-muted-foreground">
                      No templates available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="documentType">Asset Type *</Label>
                {isRootAdmin() && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateDocTypeDialog(true)}
                    className="h-auto py-1 px-2 text-xs hover:cursor-pointer"
                  >
                    <PlusCircle className="w-3 h-3 mr-1" />
                    New type
                  </Button>
                )}
              </div>
              <Select value={documentTypeId} onValueChange={setDocumentTypeId}>
                <SelectTrigger id="documentType" className="w-full">
                  <SelectValue placeholder="Select asset type" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingDocTypes ? (
                    <div className="px-2 py-2 text-sm text-muted-foreground">
                      Loading asset types...
                    </div>
                  ) : docTypesError ? (
                    <div className="px-2 py-2 text-sm text-red-500">
                      Error loading asset types
                    </div>
                  ) : documentTypes.length > 0 ? (
                    documentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          {type.color && (
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: type.color }}
                            />
                          )}
                          {type.name}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-2 text-sm text-muted-foreground">
                      No asset types available with creation permissions
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          
          <DialogFooter className="mt-8 gap-3">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={createAssetMutation.isPending || !name.trim() || !documentTypeId || !selectedOrganizationId}
              className="hover:cursor-pointer"
            >
              {createAssetMutation.isPending ? "Creating..." : "Create Asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      
      {/* Create Document Type Dialog */}
      {showCreateDocTypeDialog && (
        <CreateDocumentType
          trigger={<div />} // Empty trigger since we control it programmatically  
          open={showCreateDocTypeDialog}
          onOpenChange={handleDocumentTypeDialogClose}
          onDocumentTypeCreated={handleNewDocumentTypeCreated}
        />
      )}
    </Dialog>
  )
}