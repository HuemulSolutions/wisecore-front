import type { AddSectionExecutionRequest } from './execution-core'

export interface SectionExecutionProps {
  sectionExecution: {
    id: string;
    section_execution_id?: string;
    name?: string;
    prompt: string;
    output: string;
  };
  onUpdate?: () => void;
  readyToEdit: boolean;
}

export interface SectionOption {
  id: string;
  name: string;
}

export interface AddSectionExecutionFormProps {
  onSubmit: (values: AddSectionExecutionRequest) => void;
  isPending: boolean;
  afterFromId: string | null;
  existingSections: SectionOption[];
  onValidationChange?: (isValid: boolean) => void;
  defaultType?: 'ai' | 'manual' | 'reference';
  defaultManualInput?: string;
  documentId?: string;
}

