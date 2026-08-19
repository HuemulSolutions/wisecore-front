import type { TemplateItem } from './core'
import type { DocxTemplate } from '@/types/docx-templates'
import type { CustomFieldTemplate } from '@/types/custom-fields'
import type { SortableSectionItem } from '@/types/sections/core'

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
  canListCustomFields: boolean;
  canCreateCustomField: boolean;
  canUpdateCustomField: boolean;
  canDeleteCustomField: boolean;
  canListDocx: boolean;
  canCreateDocx: boolean;
  canUpdateDocx: boolean;
  canDeleteDocx: boolean;
  canListMedia: boolean;
  canCreateMedia: boolean;
  canUpdateMedia: boolean;
  canDeleteMedia: boolean;
  /** tag:r — ver el sheet de etiquetas asignadas al template. */
  canViewTags: boolean;
  /** tag:u — asignar/quitar etiquetas del template. */
  canManageTags: boolean;
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
  templateInstructions?: string;
  isMobile: boolean;
  hasNoSections: boolean;
  isGenerating: boolean;
  activeTab?: string;
  canCreateSection?: boolean;
  onToggleSidebar?: () => void;
  onAddSection: () => void;
  onGenerateWithAI: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onInfo?: () => void;
}

export interface TemplateInfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateData: any;
  selectedTemplate: TemplateItem | null;
  sectionsCount: number;
  docxTemplatesCount?: number;
  /** tag:r — muestra la sección de etiquetas asignadas. */
  canViewTags?: boolean;
  /** tag:u — permite asignar/quitar etiquetas desde la sección. Sin esto, solo lectura. */
  canManageTags?: boolean;
}

export interface TemplateSectionsListProps {
  sections: SortableSectionItem[];
  templateId: string;
  organizationId: string;
  onSectionsReorder: (newSections: SortableSectionItem[]) => void;
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
  canExport: boolean;
  canImport: boolean;
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
  isLoading?: boolean;
  isFetching?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export interface CustomFieldTemplateEmptyStateProps {
  onAddCustomFieldTemplate: () => void;
  canCreate?: boolean;
}

export interface TemplateCustomFieldsProps {
  templateId: string;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}
