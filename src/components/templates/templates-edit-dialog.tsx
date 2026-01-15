import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReusableDialog } from "@/components/ui/reusable-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateTemplate } from "@/services/templates";
import { Edit3 } from "lucide-react";
import { toast } from "sonner";

interface EditTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
  templateDescription?: string;
  organizationId: string;
  onSuccess: () => void;
}

export function EditTemplateDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
  templateDescription,
  organizationId,
  onSuccess,
}: EditTemplateDialogProps) {
  const queryClient = useQueryClient();
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    if (open) {
      setEditName(templateName);
      setEditDescription(templateDescription || "");
    }
  }, [open, templateName, templateDescription]);

  const updateTemplateMutation = useMutation({
    mutationFn: (data: any) => updateTemplate(templateId, data, organizationId),
    onSuccess: () => {
      toast.success("Template updated successfully");
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Error updating template: " + error.message);
    },
  });

  const handleSubmit = () => {
    updateTemplateMutation.mutate({
      name: editName.trim(),
      description: editDescription.trim() || null
    });
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Template"
      description="Update the template name and description."
      icon={Edit3}
      onSubmit={handleSubmit}
      submitLabel="Update Template"
      isSubmitting={updateTemplateMutation.isPending}
      isValid={!!editName.trim()}
      showDefaultFooter
    >
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-900 block mb-2">
            Template Name *
          </label>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Enter template name..."
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-900 block mb-2">
            Description
          </label>
          <Textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Enter template description (optional)..."
            rows={3}
          />
        </div>
      </div>
    </ReusableDialog>
  );
}
