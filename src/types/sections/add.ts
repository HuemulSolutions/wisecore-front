export interface Section {
  id: string;
  name: string;
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
