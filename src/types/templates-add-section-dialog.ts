export interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  organizationId: string;
  existingSections: any[];
  onGeneratingChange?: (isGenerating: boolean) => void;
}
