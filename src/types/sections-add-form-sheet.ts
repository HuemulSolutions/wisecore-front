import type { Section } from '@/types/sections-add'

export interface AddSectionFormSheetProps {
  documentId?: string;
  templateId?: string;
  onSubmit: (values: any) => void;
  isPending: boolean;
  existingSections?: Section[];
  onValidationChange?: (isValid: boolean) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}
