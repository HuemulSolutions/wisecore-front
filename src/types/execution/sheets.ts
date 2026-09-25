export interface ExecutionConfigSheetProps {
  instructions: string;
  onInstructionsChange: (value: string) => void;
  selectedLLM: string;
  onLLMChange: (value: string) => void;
  llms?: any[];
  isGenerating: boolean;
  executionStatus: string;
  isUpdatingLLM: boolean;
  readonly?: boolean;
}

export interface ExecutionInfoSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  executionId: string;
  documentName?: string;
  sectionName?: string;
}
