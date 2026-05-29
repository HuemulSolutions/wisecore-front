import type { TemplateItem } from './core'

export interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string | null;
  onTemplateCreated: (template: TemplateItem) => void;
}

export interface DeleteTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
  organizationId: string;
  onSuccess: () => void;
}

export interface EditTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
  templateDescription?: string;
  organizationId: string;
  onSuccess: () => void;
}

export interface AddCustomFieldTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  onAdd: (data: any) => Promise<any>;
}

export interface EditCustomFieldTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customFieldTemplate: import('@/types/custom-fields').CustomFieldTemplate | null;
  onUpdate: (id: string, data: any) => void;
  mode?: "content" | "configuration";
}
