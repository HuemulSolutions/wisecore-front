import type { Section } from './add'

export interface EditFormItem {
  id: string;
  name: string;
  prompt: string;
  order: number;
  dependencies: { id: string; name: string }[];
  type?: "ai" | "manual" | "reference" | "form";
  manual_input?: string;
  reference_section_id?: string;
  reference_mode?: "latest" | "specific";
  reference_execution_id?: string;
  referenced_document_id?: string;
  template_section_id?: string;
  form_fields?: import('./core').SectionFormField[];
}

export interface EditFormItemForBackend {
  id: string;
  name: string;
  type?: "ai" | "manual" | "reference" | "form";
  prompt?: string;
  output?: string;
  manual_input?: string;
  reference_section_id?: string;
  reference_mode?: "latest" | "specific";
  reference_execution_id?: string;
  order: number;
  dependencies: string[];
  propagate_to_template?: boolean;
  propagate_to_sections?: boolean;
  propagate_to_executions?: boolean;
  execution_id?: string;
}

export interface EditSectionFormProps {
  item: EditFormItem;
  onSubmit: (updatedItem: EditFormItemForBackend) => void;
  existingSections?: Section[];
  onValidationChange?: (isValid: boolean) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  hasTemplate?: boolean;
  isTemplateSection?: boolean;
  documentId?: string;
  templateId?: string;
  executionId?: string;
}
