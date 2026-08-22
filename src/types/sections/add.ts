import type { SectionDependencyConfig, SectionFormField } from './core'

export interface Section extends SectionDependencyConfig {
  id: string;
  name: string;
  order?: number;
  type?: string;
  form_fields?: SectionFormField[];
}

export interface AddSectionFormProps {
  templateId: string;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  isPending: boolean;
  existingSections?: Section[];
}

export interface AddSectionFormSheetProps {
  documentId?: string;
  templateId?: string;
  onSubmit: (values: any) => void;
  isPending: boolean;
  existingSections?: Section[];
  onValidationChange?: (isValid: boolean) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}
