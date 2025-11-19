import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createFolder } from "@/services/library";
import { useOrganization } from "@/contexts/organization-context";
import { AlertCircle, FolderPlus } from "lucide-react";

interface CreateFolderProps {
  trigger: React.ReactNode;
  parentFolder?: string;
  onFolderCreated?: () => void;
}

export default function CreateFolder({ trigger, parentFolder, onFolderCreated }: CreateFolderProps) {
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganization();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (newFolder: {
      name: string;
      organizationId: string;
      parentId?: string;
    }) => createFolder(newFolder.name, newFolder.organizationId, newFolder.parentId),
    onSuccess: () => {
      // Invalidar queries más específicamente
      queryClient.invalidateQueries({ queryKey: ["library", selectedOrganizationId] });
      onFolderCreated?.(); // Llamar callback del componente padre
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      setError(error.message || "An error occurred while creating the folder");
    },
  });

  const resetForm = () => {
    setName("");
    setError(null);
  };

  const handleAccept = () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!selectedOrganizationId) {
      setError("Organization is required");
      return;
    }
    setError(null);
    mutation.mutate({
      name,
      organizationId: selectedOrganizationId,
      parentId: parentFolder,
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
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={(e) => { e.preventDefault(); handleAccept(); }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-[#4464f7]" />
              New Folder
            </DialogTitle>
            <DialogDescription>
              Complete the fields below to create a new folder.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">
                  Folder Name *
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter folder name..."
                  className="w-full"
                  required
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={mutation.isPending}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !name.trim() || !selectedOrganizationId}
              className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
            >
              {mutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Create Folder
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}