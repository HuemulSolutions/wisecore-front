import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReusableDialog } from "@/components/ui/reusable-dialog";
import { Input } from "@/components/ui/input";
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
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New Template"
      description="Complete the fields below to create a new template."
      icon={FileCode}
      onCancel={handleClose}
      onSubmit={handleCreateTemplate}
      submitLabel="Create Template"
      isSubmitting={createTemplateMutation.isPending}
      isValid={!!newName.trim() && !!organizationId}
      showDefaultFooter
    >
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
    </ReusableDialog>
  );
}
