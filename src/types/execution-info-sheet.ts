export interface ExecutionInfoSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  executionId: string;
  documentName?: string;
  sectionName?: string;
}
