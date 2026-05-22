import type { TemplateItem } from '@/types/templates'

export interface TemplatesSidebarProps {
  templates: TemplateItem[];
  isLoading: boolean;
  error?: Error | unknown | null;
  selectedTemplateId: string | null;
  onTemplateSelect: (template: TemplateItem) => void;
  onTemplateDeleted?: () => void;
  organizationId: string | null;
  onRefresh?: () => void;
  onSearch?: (term: string) => void;
  searchValue?: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}
