import type { TemplateItem } from '@/types/templates'

export interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string | null;
  onTemplateCreated: (template: TemplateItem) => void;
}
