import { SectionForm } from "@/components/sections/sections-form";
import type { AddSectionFormSheetProps } from '@/types/sections';
export type { AddSectionFormSheetProps } from '@/types/sections';

export function AddSectionFormSheet({
  documentId,
  templateId,
  executionId,
  onSubmit,
  isPending,
  existingSections = [],
  onValidationChange,
  onGeneratingChange
}: AddSectionFormSheetProps) {
  return (
    <SectionForm
      mode="create"
      editorType="rich"
      formId="add-section-form"
      documentId={documentId}
      templateId={templateId}
      executionId={executionId}
      onSubmit={onSubmit}
      isPending={isPending}
      existingSections={existingSections}
      onValidationChange={onValidationChange}
      onGeneratingChange={onGeneratingChange}
    />
  );
}