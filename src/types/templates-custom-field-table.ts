import type { CustomFieldTemplate } from '@/types/custom-fields-templates'

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
