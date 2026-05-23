import type { TemplateItem } from '@/types/templates'

export interface TemplateInfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateData: any;
  selectedTemplate: TemplateItem | null;
  sectionsCount: number;
  docxTemplatesCount?: number;
}
