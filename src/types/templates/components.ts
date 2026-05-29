import type { TemplateItem } from './core'
import type { DocxTemplate } from '@/types/docx-templates'
import type { CustomFieldTemplate } from '@/types/custom-fields'

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

export interface TemplateEmptyStateProps {
  isGenerating: boolean;
  onAddSection: () => void;
  onGenerateWithAI: () => void;
  canCreate?: boolean;
}

export interface TemplateHeaderProps {
  templateName: string;
  templateDescription?: string;
  isMobile: boolean;
  hasNoSections: boolean;
  isGenerating: boolean;
  isRefreshing?: boolean;
  activeTab?: string;
  onToggleSidebar?: () => void;
  onAddSection: () => void;
  onGenerateWithAI: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  onInfo?: () => void;
}

export interface TemplateInfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateData: any;
  selectedTemplate: TemplateItem | null;
  sectionsCount: number;
  docxTemplatesCount?: number;
}

export interface TemplateSectionsListProps {
  sections: any[];
  templateId: string;
  organizationId: string;
  onSectionsReorder: (newSections: any[]) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

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

export interface PaginationConfig {
  page: number;
  pageSize: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export interface CustomFieldTemplateTableProps {
  customFieldTemplates: CustomFieldTemplate[];
  onEditCustomFieldTemplate: (customFieldTemplate: CustomFieldTemplate) => void;
  onEditContentCustomFieldTemplate: (customFieldTemplate: CustomFieldTemplate) => void;
  onDeleteCustomFieldTemplate: (customFieldTemplate: CustomFieldTemplate) => void;
  pagination?: PaginationConfig;
}

export interface CustomFieldTemplateEmptyStateProps {
  onAddCustomFieldTemplate: () => void;
}

export interface TemplateCustomFieldsProps {
  templateId: string;
}
