import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import { createTemplateSection } from "@/services/template_section";
import { AddSectionFormSheet } from "@/components/sections/sections-add-form-sheet";
import { Plus } from "lucide-react";
import { withRefresh } from "@/lib/query-utils";
import type { AddSectionDialogProps } from '@/types/templates/add-section-dialog';
export type { AddSectionDialogProps } from '@/types/templates/add-section-dialog';

export function AddSectionDialog({
  open,
  onOpenChange,
  templateId,
  organizationId,
  existingSections,
  onGeneratingChange,
  defaultType,
  containerName,
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
    mutationFn: withRefresh(
      (sectionData: any) => createTemplateSection(sectionData, organizationId),
      queryClient,
      () => [['template', templateId]],
    ),
    meta: { successMessage: t('sections:toast.sectionCreated') },
    onSuccess: () => {
      onOpenChange(false);
      setIsFormValid(false);
    },
  });

  const position = existingSections.length + 1;

  return (
    <HuemulSheet
      open={open}
      onOpenChange={(o) => {
        if (!o) setIsFormValid(false);
        onOpenChange(o);
      }}
      title={t('sections:addDialog.title', { position })}
      description={
        containerName
          ? t('templates:addSection.subtitle', { name: containerName })
          : t('templates:addSection.subtitleNoName')
      }
      icon={Plus}
      maxWidth="w-full sm:max-w-[860px]"
      cancelLabel={t('common:cancel')}
      footerLeft={<span className="text-xs text-[#64748b]">{t('sections:form.propagate.footerNote')}</span>}
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
        defaultType={defaultType}
      />
    </HuemulSheet>
  );
}
