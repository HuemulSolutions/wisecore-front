import type { Section } from './add'
import type { SectionDependencyConfig, SectionFormField } from './core'

export interface SectionItem extends SectionDependencyConfig {
  id: string;
  name: string;
  prompt: string;
  order: number;
  dependencies: { id: string; name: string }[];
  referenced_document_id?: string;
  template_section_id?: string;
  form_fields?: SectionFormField[];
}

export interface SectionFormProps {
  mode: 'create' | 'edit';
  editorType?: 'simple' | 'rich';
  formId?: string;
  documentId?: string;
  templateId?: string;
  executionId?: string;
  item?: SectionItem;
  onSubmit: (values: any) => void;
  isPending?: boolean;
  existingSections?: Section[];
  onValidationChange?: (isValid: boolean) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  hasTemplate?: boolean;
  isTemplateSection?: boolean;
  defaultType?: 'ai' | 'manual' | 'reference' | 'form';
  defaultManualInput?: string;
}
