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

interface CreateDocumentTypeProps {
  trigger: React.ReactNode;
  onDocumentTypeCreated?: (documentType: { id: string; name: string; color: string }) => void;
}

export default function CreateDocumentType({ trigger, onDocumentTypeCreated }: CreateDocumentTypeProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3B82F6");
  const [error, setError] = useState<string | null>(null);
  const { selectedOrganizationId } = useOrganization();

  const predefinedColors = [
    "#6B7280",
    "#3B82F6",
    "#EF4444",
    "#22C55E",
    "#EAB308",
    "#8B5CF6",
    "#F97316",
    "#EC4899",
    "#06B6D4",
    "#84CC16",
  ];

  const mutation = useMutation({
    mutationFn: (documentTypeData: { name: string; color: string }) => 
      createDocumentType(documentTypeData, selectedOrganizationId!),
    onSuccess: (createdDocumentType) => {
      queryClient.invalidateQueries({ queryKey: ["documentTypes"] });
      onDocumentTypeCreated?.(createdDocumentType);
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      setError(error.message || "An error occurred while creating the document type");
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

  const handleCancel = () => {
    resetForm();
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Document Type</DialogTitle>
          <DialogDescription>
            Create a new document type with a name and color.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Document type name"
            className="w-full"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <div className="grid grid-cols-5 gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 hover:cursor-pointer hover:scale-110 transition-transform ${
                    selectedColor === color ? 'border-gray-900 ring-2 ring-gray-300' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </div>
        )}

        <DialogFooter className="flex justify-end space-x-2">
          <Button
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