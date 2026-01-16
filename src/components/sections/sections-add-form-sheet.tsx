import { SectionForm } from "@/components/sections/sections-form";

interface Section {
  id: string;
  name: string;
}

interface AddSectionFormSheetProps {
  documentId?: string;
  templateId?: string;
  onSubmit: (values: any) => void;
  isPending: boolean;
  existingSections?: Section[];
  onValidationChange?: (isValid: boolean) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

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
      editorType="simple"
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