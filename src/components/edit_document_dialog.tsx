import React, { useEffect, useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDocument, getDocumentById } from '@/services/documents';
import { useOrganization } from '@/contexts/organization-context';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface EditDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  currentName: string;
  currentDescription?: string;
  onUpdated: (newName: string, newDescription?: string) => void;
}

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
          const doc = await getDocumentById(documentId);
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
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
          <DialogDescription>Modifica el nombre y la descripción del documento.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Nombre</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Document name"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Descripción</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
            />
          </div>
        </div>
        <DialogFooter className="mt-4 flex gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="hover:cursor-pointer" disabled={mutation.isPending}>Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={mutation.isPending || !name.trim()} className="hover:cursor-pointer">
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

EditDocumentDialog.displayName = 'EditDocumentDialog';

export default EditDocumentDialog;
