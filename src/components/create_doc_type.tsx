import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { createDocumentType } from "@/services/document_type";
import { ColorPicker } from "@/components/color-picker";
import { Plus } from "lucide-react";

interface CreateDocumentTypeProps {
  trigger: React.ReactNode;
  onDocumentTypeCreated?: (documentType: { id: string; name: string; color: string }) => void;
  // Optional external control
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function CreateDocumentType({ 
  trigger, 
  onDocumentTypeCreated, 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange 
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

  const mutation = useMutation({
    mutationFn: (documentTypeData: { name: string; color: string }) => 
      createDocumentType(documentTypeData, selectedOrganizationId!),
    onSuccess: (createdDocumentType) => {
      queryClient.invalidateQueries({ queryKey: ["document-types", selectedOrganizationId] });
      onDocumentTypeCreated?.(createdDocumentType);
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      setError(error.message || "An error occurred while creating the asset type");
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

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create Asset Type
          </DialogTitle>
          <DialogDescription>
            Create a new asset type with a name and color.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Asset type name"
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
            {mutation.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}