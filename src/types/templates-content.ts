import type { TemplateItem } from '@/types/templates'

export interface TemplateContentProps {
  selectedTemplate: TemplateItem | null;
  onRefresh: () => void;
  onTemplateDeleted?: () => void;
  onTemplateCreated?: (template: TemplateItem) => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canListSections: boolean;
  canCreateSection: boolean;
  canUpdateSection: boolean;
  canDeleteSection: boolean;
}
