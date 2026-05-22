import type { AddSectionExecutionRequest } from '@/services/section_execution'

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
}
