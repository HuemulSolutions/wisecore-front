import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog";
import { deleteTemplate } from "@/services/templates";
import { toast } from "sonner";

interface DeleteTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
  organizationId: string;
  onSuccess: () => void;
}

export function DeleteTemplateDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
  organizationId,
  onSuccess,
}: DeleteTemplateDialogProps) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteTemplateMutation = useMutation({
    mutationFn: () => deleteTemplate(templateId, organizationId),
    onSuccess: () => {
      toast.success("Template deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["templates", organizationId] });
    },
    onError: (error: Error) => {
      toast.error("Error deleting template: " + error.message);
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    
    const minDelay = new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          deleteTemplateMutation.mutate(undefined, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error)
          });
        }),
        minDelay
      ]);
      
      onSuccess();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ReusableAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Template"
      description={`Are you sure you want to delete "${templateName}"? This action cannot be undone and will remove all template sections.`}
      onConfirm={handleDelete}
      confirmLabel="Deleting"
      isProcessing={isDeleting}
    />
  );
}
