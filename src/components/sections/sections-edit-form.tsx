import { SectionForm } from "@/components/sections/sections-form";
import type { EditSectionFormProps } from '@/types/sections-edit-form';
export type { EditSectionFormProps } from '@/types/sections-edit-form';

export function EditSectionForm({ 
  item, 
  onSubmit, 
  existingSections = [], 
  onValidationChange, 
  onGeneratingChange,
  hasTemplate = false,
  isTemplateSection = false 
}: EditSectionFormProps) {
  return (
    <SectionForm
      mode="edit"
      editorType="rich"
      formId="edit-section-form"
      item={item}
      onSubmit={onSubmit}
      existingSections={existingSections}
      onValidationChange={onValidationChange}
      onGeneratingChange={onGeneratingChange}
      hasTemplate={hasTemplate}
      isTemplateSection={isTemplateSection}
    />
  );
}
