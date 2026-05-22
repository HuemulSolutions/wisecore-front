import type { DocxTemplate } from '@/types/docx-templates'

export interface DocxTemplateCardProps {
  template: DocxTemplate;
  canUpdate: boolean;
  canDelete: boolean;
  onRename: (template: DocxTemplate) => void;
  onReplace: (template: DocxTemplate) => void;
  onDelete: (template: DocxTemplate) => void;
}

export interface TemplateDocxListProps {
  templateId: string;
  organizationId: string;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}
