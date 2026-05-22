import type { CustomFieldTemplate } from '@/types/custom-fields-templates'

export interface EditCustomFieldTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customFieldTemplate: CustomFieldTemplate | null;
  onUpdate: (id: string, data: any) => void;
  mode?: "content" | "configuration";
}
