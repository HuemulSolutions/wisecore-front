import { SectionForm } from "@/components/sections/sections-form";
import type { EditSectionFormProps } from '@/types/sections';
export type { EditSectionFormProps } from '@/types/sections';

export function EditSectionForm({
  item,
  onSubmit,
  existingSections = [],
  onValidationChange,
  onGeneratingChange,
  onDirtyChange,
  hasTemplate = false,
  isTemplateSection = false,
  documentId,
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
      onDirtyChange={onDirtyChange}
      hasTemplate={hasTemplate}
      isTemplateSection={isTemplateSection}
      documentId={documentId}
    />
  );
}
