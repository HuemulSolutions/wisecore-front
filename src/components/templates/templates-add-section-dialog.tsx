import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HuemulDialog } from "@/huemul/components/huemul-dialog";
import { createTemplateSection } from "@/services/template_section";
import { AddSectionFormSheet } from "@/components/sections/sections-add-form-sheet";
import { Plus } from "lucide-react";

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
  const { t } = useTranslation(['sections', 'templates', 'common']);
  const queryClient = useQueryClient();
  const [isFormValid, setIsFormValid] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratingChange = (generating: boolean) => {
    setIsGenerating(generating);
    onGeneratingChange?.(generating);
  };

  const addSectionMutation = useMutation({
    mutationFn: (sectionData: any) => createTemplateSection(sectionData, organizationId),
    meta: { successMessage: t('sections:toast.sectionCreated') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      onOpenChange(false);
      setIsFormValid(false);
    },
  });

  return (
    <HuemulDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setIsFormValid(false);
        onOpenChange(o);
      }}
      title={t('sections:addDialog.title')}
      description={t('templates:addSection.description')}
      icon={Plus}
      maxWidth="sm:max-w-3xl"
      maxHeight="max-h-[90vh]"
      cancelLabel={t('common:cancel')}
      saveAction={{
        label: addSectionMutation.isPending ? t('templates:addSection.saving') : t('templates:addSection.save'),
        icon: Plus,
        disabled: !isFormValid || addSectionMutation.isPending || isGenerating,
        loading: addSectionMutation.isPending,
        closeOnSuccess: false,
        onClick: () => {
          (document.getElementById("add-section-form") as HTMLFormElement)?.requestSubmit();
        },
      }}
    >
      <AddSectionFormSheet
        templateId={templateId}
        onSubmit={(values: any) => addSectionMutation.mutate(values)}
        isPending={addSectionMutation.isPending}
        existingSections={existingSections}
        onValidationChange={setIsFormValid}
        onGeneratingChange={handleGeneratingChange}
      />
    </HuemulDialog>
  );
}
