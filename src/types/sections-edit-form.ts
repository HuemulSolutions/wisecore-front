import type { Section } from '@/types/sections-add'

export interface Item {
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
  referenced_document_id?: string;
  template_section_id?: string;
}

export interface ItemForBackend {
  id: string;
  name: string;
  type?: "ai" | "manual" | "reference";
  prompt?: string;
  output?: string;
  manual_input?: string;
  reference_section_id?: string;
  reference_mode?: "latest" | "specific";
  reference_execution_id?: string;
  order: number;
  dependencies?: string[];
  propagate_to_template?: boolean;
  propagate_to_sections?: boolean;
}

export interface EditSectionFormProps {
  item: Item;
  onSubmit: (updatedItem: ItemForBackend) => void;
  existingSections?: Section[];
  onValidationChange?: (isValid: boolean) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
  hasTemplate?: boolean;
  isTemplateSection?: boolean;
}
