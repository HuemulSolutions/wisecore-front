import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { addTemplate } from "@/services/templates";
import { AlertCircle, FileCode } from "lucide-react";
import { toast } from "sonner";

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string | null;
  onTemplateCreated: (template: { id: string; name: string; description?: string }) => void;
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
  organizationId,
  onTemplateCreated,
}: CreateTemplateDialogProps) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createTemplateMutation = useMutation({
    mutationFn: (newData: { name: string; description: string; organization_id: string }) =>
      addTemplate(newData),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["templates", organizationId] });
      onTemplateCreated({ id: created.id, name: created.name, description: created.description });
      setNewName("");
      setNewDescription("");
      setError(null);
      onOpenChange(false);
      toast.success("Template created successfully");
    },
    onError: (error: Error) => {
      setError(error.message || "An error occurred while creating the template");
    },
  });

  const handleCreateTemplate = () => {
    if (!newName.trim()) {
      setError("Name is required");
      return;
    }
    if (!organizationId) {
      setError("Organization is required");
      return;
    }
    setError(null);
    createTemplateMutation.mutate({
      name: newName,
      description: newDescription,
      organization_id: organizationId,
    });
  };

  const handleClose = () => {
    setNewName("");
    setNewDescription("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={(e) => { e.preventDefault(); handleCreateTemplate(); }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-[#4464f7]" />
              New Template
            </DialogTitle>
            <DialogDescription>
              Complete the fields below to create a new template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="template-name" className="text-sm font-medium text-gray-900 block mb-2">
                  Template Name *
                </label>
                <Input
                  id="template-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter template name..."
                  className="w-full"
                  required
                />
              </div>
              <div>
                <label htmlFor="template-description" className="text-sm font-medium text-gray-900 block mb-2">
                  Description
                </label>
                <Input
                  id="template-description"
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Enter template description (optional)..."
                  className="w-full"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createTemplateMutation.isPending}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!newName.trim() || !organizationId || createTemplateMutation.isPending} 
              className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
            >
              {createTemplateMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <FileCode className="mr-2 h-4 w-4" />
                  Create Template
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
