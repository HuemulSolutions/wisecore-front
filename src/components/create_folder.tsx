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
  DialogFooter,
} from "@/components/ui/dialog";
import { createFolder } from "@/services/library";
import { useOrganization } from "@/contexts/organization-context";

interface CreateFolderProps {
  trigger: React.ReactNode;
  parentFolder?: string;
}

export default function CreateFolder({ trigger, parentFolder }: CreateFolderProps) {
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
      queryClient.invalidateQueries({ queryKey: ["library"] });
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

      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
          <DialogDescription>
            Complete the fields below to create a new folder.
          </DialogDescription>
        </DialogHeader>

        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Folder name"
          className="w-full border rounded px-2 py-1"
        />

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mt-2">
            {error}
          </div>
        )}

        <DialogFooter className="flex justify-end space-x-2 mt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="hover:cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={mutation.isPending || !name.trim() || !selectedOrganizationId}
            className="hover:cursor-pointer"
          >
            {mutation.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}