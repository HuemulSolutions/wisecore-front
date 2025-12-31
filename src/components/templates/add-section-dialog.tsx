import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createTemplateSection } from "@/services/template_section";
import { AddSectionFormSheet } from "@/components/add_section_form_sheet";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  organizationId: string;
  existingSections: any[];
  onGeneratingChange?: (isGenerating: boolean) => void;
}

export function AddSectionDialog({
  open,
  onOpenChange,
  templateId,
  organizationId,
  existingSections,
  onGeneratingChange,
}: AddSectionDialogProps) {
  const queryClient = useQueryClient();
  const [isFormValid, setIsFormValid] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratingChange = (generating: boolean) => {
    setIsGenerating(generating);
    onGeneratingChange?.(generating);
  };

  const addSectionMutation = useMutation({
    mutationFn: (sectionData: any) => createTemplateSection(sectionData, organizationId),
    onSuccess: () => {
      toast.success("Section created successfully");
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      onOpenChange(false);
      setIsFormValid(false);
    },
    onError: (error: Error) => {
      toast.error("Error creating section: " + error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0">
        <div className="px-6 pt-6 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4 text-[#4464f7]" />
              Add New Section
            </DialogTitle>
            <DialogDescription className="text-xs">
              Create a structured section for your template with custom content and dependencies.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          <div className="space-y-4">
            <AddSectionFormSheet
              templateId={templateId}
              onSubmit={(values: any) => addSectionMutation.mutate(values)}
              isPending={addSectionMutation.isPending}
              existingSections={existingSections}
              onValidationChange={setIsFormValid}
              onGeneratingChange={handleGeneratingChange}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setIsFormValid(false);
            }}
            className="hover:cursor-pointer"
            disabled={addSectionMutation.isPending || isGenerating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-section-form"
            className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
            disabled={addSectionMutation.isPending || !isFormValid}
          >
            {addSectionMutation.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Adding Section...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Save Section
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
