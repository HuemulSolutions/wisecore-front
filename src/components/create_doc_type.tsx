import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrganization } from "@/contexts/organization-context";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createDocumentType, updateDocumentType, getDocumentTypeById } from "@/services/document-types";
import { ColorPicker } from "@/components/color-picker";
import { Plus, Loader2 } from "lucide-react";
import { type AssetTypeWithRoles } from "@/services/asset-types";

interface CreateDocumentTypeProps {
  trigger?: React.ReactNode;
  onDocumentTypeCreated?: (documentType: { id: string; name: string; color: string }) => void;
  // Optional external control
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Document type for editing
  documentType?: AssetTypeWithRoles | null;
  // Type: 'document' or 'asset'
  type?: 'document' | 'asset';
}

export default function CreateDocumentType({ 
  trigger, 
  onDocumentTypeCreated, 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange,
  documentType,
  type = 'document'
}: CreateDocumentTypeProps) {
  const queryClient = useQueryClient();
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  
  // Use external control if provided, otherwise use internal state
  const isDialogOpen = externalOpen !== undefined ? externalOpen : internalDialogOpen;
  const setIsDialogOpen = externalOnOpenChange || setInternalDialogOpen;
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3B82F6");
  const [error, setError] = useState<string | null>(null);
  const { selectedOrganizationId } = useOrganization();

  const isEditing = !!documentType;
  const documentTypeId = documentType?.document_type_id;

  // Fetch document type data when editing
  const { data: documentTypeData, isLoading: isLoadingDocumentType } = useQuery({
    queryKey: ['document-type', documentTypeId],
    queryFn: () => getDocumentTypeById(documentTypeId!),
    enabled: isEditing && !!documentTypeId && isDialogOpen,
  });

  // Update form when document type data is loaded
  useEffect(() => {
    if (documentTypeData?.data) {
      setName(documentTypeData.data.name);
      setSelectedColor(documentTypeData.data.color);
    }
  }, [documentTypeData]);

  // Reset form when dialog closes or documentType changes
  useEffect(() => {
    if (!isDialogOpen) {
      resetForm();
    }
  }, [isDialogOpen]);

  const mutation = useMutation({
    mutationFn: (documentTypeData: { name: string; color: string }) => {
      if (isEditing && documentTypeId) {
        return updateDocumentType(documentTypeId, documentTypeData);
      }
      return createDocumentType(documentTypeData);
    },
    onSuccess: (result) => {
      const queryKey = type === 'asset' ? 'asset-types' : 'document-types';
      queryClient.invalidateQueries({ queryKey: [queryKey, 'list-with-roles'] });
      queryClient.invalidateQueries({ queryKey: [queryKey, selectedOrganizationId] });
      onDocumentTypeCreated?.(result);
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      const action = isEditing ? 'updating' : 'creating';
      setError(error.message || `An error occurred while ${action} the ${type} type`);
    },
  });

  const resetForm = () => {
    setName("");
    setSelectedColor("#3B82F6");
    setError(null);
  };

  const handleAccept = () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setError(null);
    
    mutation.mutate({
      name: name.trim(),
      color: selectedColor,
    });
  };

  const handleCancel = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    resetForm();
    setIsDialogOpen(false);
  };

  const typeLabel = type === 'asset' ? 'Asset Type' : 'Document Type';

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            {isEditing ? `Edit ${typeLabel}` : `Create ${typeLabel}`}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? `Update the ${typeLabel.toLowerCase()} name and color.` : `Create a new ${typeLabel.toLowerCase()} with a name and color.`}
          </DialogDescription>
        </DialogHeader>

        {isLoadingDocumentType ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`${typeLabel} name`}
                className="w-full"
              />

              <ColorPicker
                label="Color"
                value={selectedColor}
                onChange={setSelectedColor}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </div>
            )}

            <DialogFooter className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="hover:cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAccept}
                disabled={!name.trim() || mutation.isPending}
                className="hover:cursor-pointer"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Update' : 'Create'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}