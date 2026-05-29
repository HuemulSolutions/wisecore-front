import { SectionForm } from "@/components/sections/sections-form";
import type { AddSectionFormSheetProps } from '@/types/sections';
export type { AddSectionFormSheetProps } from '@/types/sections';

export function AddSectionFormSheet({ 
  documentId, 
  templateId, 
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
      onSubmit={onSubmit}
      isPending={isPending}
      existingSections={existingSections}
      onValidationChange={onValidationChange}
      onGeneratingChange={onGeneratingChange}
    />
  );
}