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
  /** template:r — exportar la plantilla seleccionada como JSON desde "Más acciones". */
  canExportTemplate: boolean;
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
  /** template:r — GET /templates/{id}/context (tab Contexto). */
  canListTemplateContext: boolean;
  /** template:u — POST/PATCH/DELETE de contexto del template. */
  canManageTemplateContext: boolean;
  /** template:r — GET /templates/{id}/dependencies (tab Dependencias). */
  canListTemplateDependencies: boolean;
  /** template:u — POST/PATCH/DELETE de dependencias del template. */
  canManageTemplateDependencies: boolean;
  /** asset:l|r + folder:l|r — el picker de documentos del alta de dependencia. */
  canPickAssetsForDependencies: boolean;
  /** template:r — GET /templates/{id}/child-documents (tab Documentos creados). */
  canListChildDocuments: boolean;
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
  /** Chevron a la izquierda del título — vuelve a la lista de grupos de "Configuración". */
  onBack?: () => void;
}

export interface TemplateEmptyStateProps {
  isGenerating: boolean;
  onAddSectionWithType: (type: 'form' | 'ai' | 'manual' | 'reference') => void;
  onImportStructure: () => void;
  /** Botón "Que la IA proponga la estructura" del pie de la card. */
  onGenerateWithAI: () => void;
  canCreate?: boolean;
}

export interface TemplateHeaderProps {
  templateName: string;
  templateDescription?: string;
  templateInstructions?: string;
  isMobile: boolean;
  /** Solo rama mobile: deshabilita el botón rápido de "Agregar sección" mientras se genera con IA. */
  isGenerating: boolean;
  /** Solo rama mobile: cuál de las 3 pestañas está activa, para mostrar el botón rápido de agregar sección. */
  activeTab?: string;
  /** Solo rama mobile: habilita el botón rápido de "Agregar sección". */
  canCreateSection?: boolean;
  onToggleSidebar?: () => void;
  /** Solo rama mobile. */
  onAddSection: () => void;
  onEdit: () => void;
  /** template:u — oculta "Editar datos" si no está permitido. */
  canUpdate: boolean;
  onDelete: () => void;
  /** template:d — oculta "Eliminar plantilla" del menú si no está permitido. */
  canDelete: boolean;
  onInfo?: () => void;
  onDuplicate: () => void;
  /** template:c — oculta "Duplicar plantilla" del menú si no está permitido. */
  canDuplicate: boolean;
  onExportJson: () => void;
  /** template:r — oculta "Exportar como JSON" del menú si no está permitido. */
  canExportJson: boolean;
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
  templateName: string;
  organizationId: string;
  onSectionsReorder: (newSections: SortableSectionItem[]) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  /** Botón final "Agregar sección al final" — oculto si no se pasa o sin permiso de creación. */
  onAddSectionAtEnd?: () => void;
  canCreate?: boolean;
  /** Cruce contra la matriz de lifecycle access — badge "Visible solo en algunas etapas". Ausente = no se muestra. */
  sectionHasOwnRulesFn?: (sectionId: string) => boolean;
}

// Wrapper de dominio de una fila de HuemulOrderedItemCard — arma sus props a
// partir de SortableSectionItem + lifecycle access. Mantiene el drag&drop
// (dnd-kit) propio, igual que SortableSectionSheet, pero es un componente
// aparte (ver ia context/refactor-file-guide.md §1.2 — SortableSectionSheet
// sigue sirviendo a assets/executions sin cambios).
export interface TemplateSectionCardProps {
  section: SortableSectionItem;
  /** Posición 0-based dentro de `sections` — define el número de orden mostrado. */
  index: number;
  /** Lista completa ordenada — para "Usa como contexto" y para saber si es la primera/última fila. */
  sections: SortableSectionItem[];
  templateId: string;
  templateName: string;
  hasOwnLifecycleRule?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  isOverlay?: boolean;
  isMenuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onSave: (sectionId: string, sectionData: object) => void;
  onDelete: (sectionId: string, options?: { propagate_to_documents?: boolean }) => Promise<void>;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

// Pestaña "Estructura": header dinámico + lista/estado vacío — extraída de
// templates-content.tsx (era el único de los 3 tabs que seguía inline).
export interface TemplateStructureTabProps {
  templateId: string;
  templateName: string;
  organizationId: string;
  documentTypeId?: string | null;
  sections: SortableSectionItem[];
  isGenerating: boolean;
  onGenerateWithAI: () => void;
  onAddSection: () => void;
  onAddSectionWithType: (type: 'form' | 'ai' | 'manual' | 'reference') => void;
  onSectionsReorder: (newSections: SortableSectionItem[]) => void;
  onImportStructure: () => void;
  onRefreshTemplate: () => void;
  isFetchingTemplate: boolean;
  /** template_section:l|r — gatea también la lectura de la matriz de lifecycle access. */
  canListSections: boolean;
  canCreateSection?: boolean;
  canUpdateSection?: boolean;
  canDeleteSection?: boolean;
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
  hasNext?: boolean;
  onLoadMore?: () => void;
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
  canCreate?: boolean;
}

export interface TemplateCustomFieldsProps {
  templateId: string;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  /** Chevron a la izquierda del título — vuelve a la lista de grupos de "Configuración". */
  onBack?: () => void;
}

export interface TemplateFormValues {
  name: string;
  description: string;
  instructions: string;
  contextRequired: boolean;
}

// Pestaña "Configuración": lista de 5 grupos (nivel 1) + detalle de un grupo
// (nivel 2), cada grupo gateado por su propio permiso — ver
// ia context/huemul-page-layout-guide.md y ia context/list-detail-panel-guide.md.
export type TemplateSettingsSection = "custom-fields" | "context" | "dependencies" | "media" | "docx-templates";

// Flags de permiso compartidos entre la lista de grupos (nivel 1, solo
// necesita los canList* para contar/mostrar cada fila) y el detalle de un
// grupo (nivel 2, necesita además los can*/canManage* de alta-edición-baja).
export interface TemplateSettingsGroupFlags {
  canListCustomFields: boolean;
  canCreateCustomField: boolean;
  canUpdateCustomField: boolean;
  canDeleteCustomField: boolean;
  canListTemplateContext: boolean;
  canManageTemplateContext: boolean;
  canListTemplateDependencies: boolean;
  canManageTemplateDependencies: boolean;
  canPickAssetsForDependencies: boolean;
  canListMedia: boolean;
  canCreateMedia: boolean;
  canUpdateMedia: boolean;
  canDeleteMedia: boolean;
  canListDocx: boolean;
  canCreateDocx: boolean;
  canUpdateDocx: boolean;
  canDeleteDocx: boolean;
}

export interface TemplateSettingsTabProps extends TemplateSettingsGroupFlags {
  templateId: string;
  organizationId: string;
  /** Notifica la suma de los 5 contadores al padre para el pill de la pestaña. */
  onCountChange?: (count: number) => void;
}

// Nivel 1: tarjeta única con una fila por grupo (contador real + chevron).
export interface TemplateSettingsGroupsListProps extends TemplateSettingsGroupFlags {
  templateId: string;
  organizationId: string;
  onSelect: (section: TemplateSettingsSection) => void;
  onCountsChange?: (total: number) => void;
}

// Nivel 2: link "Volver" + tarjeta con el contenido real del grupo activo.
export interface TemplateSettingsGroupDetailProps extends TemplateSettingsGroupFlags {
  templateId: string;
  organizationId: string;
  section: TemplateSettingsSection;
  onBack: () => void;
}

// Pestaña "Documentos creados": tabla agrupada por carpeta (solo lectura) de
// los activos generados a partir del template — ver
// ia context/tabla-agrupada-drag-and-drop-guide.md.
export interface TemplateDocumentsTabProps {
  templateId: string;
  organizationId: string;
  canList: boolean;
  /** Notifica el total de documentos al padre para el pill del header. */
  onCountChange?: (count: number) => void;
}

export interface TemplateFormFieldsProps {
  values: TemplateFormValues;
  onChange: (patch: Partial<TemplateFormValues>) => void;
  disabled?: boolean;
}
