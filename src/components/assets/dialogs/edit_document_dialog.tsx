import React, { useEffect, useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDocument, getDocumentById } from '@/services/documents';
import { useOrganization } from '@/contexts/organization-context';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileText, Edit3 } from 'lucide-react';
import type { EditDocumentDialogProps } from "@/types/assets";

const EditDocumentDialog: React.FC<EditDocumentDialogProps> = React.memo(({ open, onOpenChange, documentId, currentName, currentDescription, onUpdated }) => {
  const { selectedOrganizationId } = useOrganization();
  const queryClient = useQueryClient();

  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription || '');

  // Prefill cuando se abre o cambia el doc
  useEffect(() => {
    let cancelled = false;
    async function prefill() {
      if (!open) return;
      setName(currentName);
      if (currentDescription !== undefined) {
        setDescription(currentDescription || '');
      } else {
        try {
          const doc = await getDocumentById(documentId, selectedOrganizationId!);
          if (!cancelled) {
            setDescription(doc?.description || '');
          }
        } catch (e) {
          // Silencioso: si falla, dejamos campo vacío
        }
      }
    }
    prefill();
    return () => { cancelled = true };
  }, [open, currentName, currentDescription, documentId]);

  const mutation = useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      if (!selectedOrganizationId) throw new Error('Organization not selected');
      return updateDocument(documentId, payload, selectedOrganizationId);
    },
    onSuccess: (data) => {
      toast.success('Documento actualizado');
      queryClient.invalidateQueries({ queryKey: ['document-content', documentId] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
      onUpdated(data.name, data.description);
      onOpenChange(false);
    },
    onError: (e: any) => {
      toast.error(e?.message || 'Error al actualizar');
    },
  });

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    mutation.mutate({ name: name.trim(), description: description.trim() || undefined });
  }, [name, description, mutation]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px]"
        onPointerDownOutside={(e) => {
          // Evitar cierre si el click original proviene de un elemento de menú recién desmontado
          const target = e.target as HTMLElement;
          if (target && target.closest('[data-radix-dropdown-menu-content]')) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target && target.closest('[data-radix-dropdown-menu-content]')) {
            e.preventDefault();
          }
        }}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-[#4464f7]" />
              Edit Asset
            </DialogTitle>
            <DialogDescription>
              Update the asset name and description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">
                  Asset Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter asset name..."
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">
                  Description
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description (optional)..."
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <DialogClose asChild>
              <Button 
                type="button"
                variant="outline" 
                className="hover:cursor-pointer" 
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit"
              onClick={handleSave} 
              disabled={mutation.isPending || !name.trim()} 
              className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
            >
              {mutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Updating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Update Asset
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

EditDocumentDialog.displayName = 'EditDocumentDialog';

export default EditDocumentDialog;
