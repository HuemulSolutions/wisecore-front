export * from './core'
// dialogs.ts: CreateTemplateDialogProps is needed by templates-create-dialog.tsx
export type { CreateTemplateDialogProps, CloneTemplateDialogProps, DeleteTemplateDialogProps, EditTemplateDialogProps, AddCustomFieldTemplateDialogProps, EditCustomFieldTemplateDialogProps } from './dialogs'
// components.ts: PaginationConfig conflicts with @/types/data-table — selective export
export type { TemplateContentProps, TemplateHeaderProps, TemplateSectionsListProps, TemplatesSidebarProps, DocxTemplateCardProps, TemplateDocxListProps, TemplateEmptyStateProps, TemplateInfoSheetProps, CustomFieldTemplateTableProps, CustomFieldTemplateEmptyStateProps, TemplateCustomFieldsProps } from './components'
// NOTE: add-section-dialog exports AddSectionDialogProps which conflicts with the assets version.
// Import directly from '@/types/templates/add-section-dialog' if needed.
export * from './hooks'
export * from './section-lifecycle-access'
// context.ts / dependencies.ts: export selectivo — TemplateDependency es un
// alias de Dependency (@/types/dependency/sheets) y no queremos que un
// `export *` lo reexporte con un nombre que choque si ese barrel cambia.
export type { TemplateContext, CreateTemplateContextRequest, UpdateTemplateContextRequest, UseTemplateContextsOptions } from './context'
export type { TemplateDependency, TemplateDependenciesResponse, CreateTemplateDependencyRequest, UpdateTemplateDependencyRequest, UseTemplateDependenciesOptions } from './dependencies'
