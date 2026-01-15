import React, { useEffect, useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDocument, getDocumentById } from '@/services/assets';
import { useOrganization } from '@/contexts/organization-context';
import { useRoleDocumentTypes } from '@/hooks/useRoleDocumentTypes';
import { ReusableDialog } from '@/components/ui/reusable-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Edit3 } from 'lucide-react';
import type { EditDocumentDialogProps } from "@/types/assets";

const EditDocumentDialog: React.FC<EditDocumentDialogProps> = React.memo(({ 
  open, 
  onOpenChange, 
  documentId, 
  currentName, 
  currentDescription, 
  currentDocumentTypeId,
  onUpdated 
}) => {
  const { selectedOrganizationId } = useOrganization();
  const queryClient = useQueryClient();

  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription || '');
  const [internalCode, setInternalCode] = useState('');
  const [documentTypeId, setDocumentTypeId] = useState(currentDocumentTypeId || '');

  // Fetch document types based on current user's role
  const { data: documentTypes = [], isLoading: isLoadingDocTypes, error: docTypesError } = useRoleDocumentTypes(open && !!selectedOrganizationId);

  // Prefill cuando se abre o cambia el doc
  useEffect(() => {
    let cancelled = false;
    async function prefill() {
      if (!open) return;
      setName(currentName);
      setDescription(currentDescription || '');
      
      // Siempre cargar datos del documento para obtener todos los campos
      try {
        const doc = await getDocumentById(documentId, selectedOrganizationId!);
        if (!cancelled) {
          setDescription(doc?.description || '');
          setInternalCode(doc?.internal_code || '');
          setDocumentTypeId(doc?.document_type?.id || '');
        }
      } catch (e) {
        console.error('Error loading document:', e);
        // Si falla, usar valores proporcionados como fallback
        setDescription(currentDescription || '');
        setDocumentTypeId(currentDocumentTypeId || '');
      }
    }
    prefill();
    return () => { cancelled = true };
  }, [open, currentName, currentDescription, currentDocumentTypeId, documentId, selectedOrganizationId]);

  const mutation = useMutation({
    mutationFn: async (payload: { name: string; description?: string; internal_code?: string; document_type_id?: string }) => {
      if (!selectedOrganizationId) throw new Error('Organization not selected');
      return updateDocument(documentId, payload, selectedOrganizationId);
    },
    onSuccess: (data) => {
      toast.success('Asset updated successfully');
      // Refresh file tree/library to show updated asset info
      queryClient.invalidateQueries({ queryKey: ['library', selectedOrganizationId] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
      // Refresh document content and details
      queryClient.invalidateQueries({ queryKey: ['document-content', documentId] });
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      onUpdated(data.name, data.description);
      onOpenChange(false);
    },
    onError: (e: any) => {
      toast.error(e?.message || 'Failed to update asset');
    },
  });

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      toast.error('Asset name is required');
      return;
    }
    if (!documentTypeId || !documentTypeId.trim()) {
      toast.error('Asset type is required');
      return;
    }
    
    const payload: { name: string; description?: string; internal_code?: string; document_type_id: string } = {
      name: name.trim(),
      document_type_id: documentTypeId.trim(),
    };
    
    if (description.trim()) {
      payload.description = description.trim();
    }
    
    if (internalCode.trim()) {
      payload.internal_code = internalCode.trim();
    }
    
    console.log('Updating document with payload:', payload);
    mutation.mutate(payload);
  }, [name, description, internalCode, documentTypeId, mutation]);

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Asset"
      description="Update the asset information."
      icon={Edit3}
      maxWidth="lg"
      showDefaultFooter
      onCancel={() => onOpenChange(false)}
      submitLabel="Update Asset"
      cancelLabel="Cancel"
      isSubmitting={mutation.isPending}
      isValid={!!name.trim() && !!documentTypeId}
      formId="edit-document-form"
    >
      <form id="edit-document-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Asset Name *</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter asset name"
              autoFocus
              required
              disabled={mutation.isPending}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="internalCode">Internal Code (Optional)</Label>
            <Input
              id="internalCode"
              name="internalCode"
              value={internalCode}
              onChange={(e) => setInternalCode(e.target.value)}
              placeholder="Enter internal code"
              disabled={mutation.isPending}
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
              disabled={mutation.isPending}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="documentType">Asset Type *</Label>
            <Select value={documentTypeId} onValueChange={setDocumentTypeId} disabled={mutation.isPending}>
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
                    No asset types available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </form>
    </ReusableDialog>
  );
});

EditDocumentDialog.displayName = 'EditDocumentDialog';

export default EditDocumentDialog;
