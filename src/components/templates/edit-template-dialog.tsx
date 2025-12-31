import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateTemplate } from "@/services/templates";
import { Edit3, FileCode } from "lucide-react";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTemplateMutation.mutate({
      name: editName.trim(),
      description: editDescription.trim() || null
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Edit3 className="h-4 w-4 text-[#4464f7]" />
              Edit Template
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update the template name and description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateTemplateMutation.isPending}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!editName.trim() || updateTemplateMutation.isPending}
              className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
            >
              {updateTemplateMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Updating...
                </>
              ) : (
                <>
                  <FileCode className="mr-2 h-4 w-4" />
                  Update Template
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
