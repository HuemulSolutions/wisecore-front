export interface AddCustomFieldTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  onAdd: (data: any) => Promise<any>;
}
