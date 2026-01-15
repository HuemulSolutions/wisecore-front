import { SectionForm } from "@/components/sections/sections-form";

interface Item {
  id: string;
  name: string;
  prompt: string;
  order: number;
  dependencies: { id: string; name: string }[];
  type?: "ai" | "manual" | "reference";
  manual_input?: string;
  reference_section_id?: string;
  reference_mode?: "latest" | "specific";
  reference_execution_id?: string;
}

interface ItemForBackend {
  id: string;
  name: string;
  type?: "ai" | "manual" | "reference";
  prompt?: string;
  manual_input?: string;
  reference_section_id?: string;
  reference_mode?: "latest" | "specific";
  reference_execution_id?: string;
  order: number;
  dependencies?: string[];
  propagate_to_template?: boolean;
  propagate_to_sections?: boolean;
}

interface Section {
  id: string;
  name: string;
}

interface EditSectionFormProps {
  item: Item;
  onSubmit: (updatedItem: ItemForBackend) => void;
  existingSections?: Section[];
  onValidationChange?: (isValid: boolean) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
  hasTemplate?: boolean;
  isTemplateSection?: boolean;
}

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
      editorType="simple"
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
