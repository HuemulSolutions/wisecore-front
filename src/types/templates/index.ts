export * from './core'
// dialogs.ts: CreateTemplateDialogProps is needed by templates-create-dialog.tsx
export type { CreateTemplateDialogProps, CloneTemplateDialogProps, DeleteTemplateDialogProps, EditTemplateDialogProps, AddCustomFieldTemplateDialogProps, EditCustomFieldTemplateDialogProps } from './dialogs'
// components.ts: PaginationConfig conflicts with @/types/data-table — selective export
export type { TemplateContentProps, TemplateHeaderProps, TemplateSectionsListProps, TemplatesSidebarProps, DocxTemplateCardProps, TemplateDocxListProps, TemplateEmptyStateProps, TemplateInfoSheetProps, CustomFieldTemplateTableProps, CustomFieldTemplateEmptyStateProps, TemplateCustomFieldsProps } from './components'
// NOTE: add-section-dialog exports AddSectionDialogProps which conflicts with the assets version.
// Import directly from '@/types/templates/add-section-dialog' if needed.
export * from './hooks'
export * from './section-lifecycle-access'
