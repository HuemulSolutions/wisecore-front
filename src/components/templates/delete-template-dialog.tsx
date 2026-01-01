import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteTemplate } from "@/services/templates";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
    
    // Crear una promesa con delay mínimo de 800ms
    const minDelay = new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      // Ejecutar la mutación y esperar ambas promesas
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
    <AlertDialog open={open} onOpenChange={(open) => {
      if (!open && !isDeleting) {
        onOpenChange(open);
      }
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Template</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{templateName}"? This action cannot be undone and will remove all template sections.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className="bg-destructive hover:bg-destructive/90 hover:cursor-pointer"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
