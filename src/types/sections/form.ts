import type { Section } from './add'

export interface SectionItem {
  id: string;
  name: string;
  prompt: string;
  order: number;
  dependencies: { id: string; name: string }[];
  referenced_document_id?: string;
  template_section_id?: string;
}

export interface SectionFormProps {
  mode: 'create' | 'edit';
  editorType?: 'simple' | 'rich';
  formId?: string;
  documentId?: string;
  templateId?: string;
  item?: SectionItem;
  onSubmit: (values: any) => void;
  isPending?: boolean;
  existingSections?: Section[];
  onValidationChange?: (isValid: boolean) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
  hasTemplate?: boolean;
  isTemplateSection?: boolean;
  defaultType?: 'ai' | 'manual' | 'reference';
  defaultManualInput?: string;
}
