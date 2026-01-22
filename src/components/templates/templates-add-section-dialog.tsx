import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReusableDialog } from "@/components/ui/reusable-dialog";
import { Button } from "@/components/ui/button";
import { createTemplateSection } from "@/services/template_section";
import { AddSectionFormSheet } from "@/components/sections/sections-add-form-sheet";
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
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add New Section"
      description="Create a structured section for your template with custom content and dependencies."
      icon={Plus}
      maxWidth="xl"
      maxHeight="90vh"
      footer={
        <>
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
        </>
      }
    >
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
    </ReusableDialog>
  );
}
