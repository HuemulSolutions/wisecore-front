// Sheet / drawer component props for the assets module
import type { LifecyclePermissions } from './core'
import type { SectionDependencyConfig, SectionFormField } from '../sections/core'

// ----------------------------------------
// Context Sheet
// ----------------------------------------

export interface ContextSheetProps {
  selectedFile: {
    id: string
    name: string
    type: "folder" | "document"
    access_levels?: string[]
  } | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isMobile?: boolean
  documentName?: string
  lifecyclePermissions?: LifecyclePermissions
  stage?: string
  showTrigger?: boolean
}

// ----------------------------------------
// Dependencies Sheet
// ----------------------------------------

export interface DependenciesSheetProps {
  selectedFile: {
    id: string
    name: string
    type: "folder" | "document"
    access_levels?: string[]
  } | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isMobile?: boolean
  documentName?: string
  lifecyclePermissions?: LifecyclePermissions
  stage?: string
  showTrigger?: boolean
}

// ----------------------------------------
// Execute Sheet
// ----------------------------------------

export interface ExecuteSheetProps {
  selectedFile: {
    id: string
    name: string
    type: "folder" | "document"
    access_levels?: string[]
  } | null
  fullDocument?: any
  isLoadingFullDocument?: boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSectionSheetOpen: () => void
  onExecutionComplete?: () => void
  onExecutionCreated?: (executionId: string, mode: 'full' | 'full-single' | 'single' | 'from', sectionIndex?: number) => void
  isMobile?: boolean
  disabled?: boolean
  disabledReason?: string
  selectedExecutionId?: string | null
  executionContext?: { type: 'header' | 'section', sectionIndex?: number, sectionId?: string } | null
}

// ----------------------------------------
// Export Custom Word
// ----------------------------------------

export interface CustomWordExportSheetProps {
  selectedFile: {
    id: string
    name: string
    type: 'folder' | 'document'
  } | null
  selectedExecutionId: string | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

// ----------------------------------------
// Info Sheet
// ----------------------------------------

export interface AssetsInfoSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentContent: any
  selectedExecutionInfo: any
  /** tag:r — muestra la sección de etiquetas asignadas. */
  canViewTags?: boolean
  /** tag:u — permite asignar/quitar etiquetas desde la sección. Sin esto, solo lectura. */
  canManageTags?: boolean
}

// ----------------------------------------
// Sections Sheet
// ----------------------------------------

export interface SectionSheetProps {
  selectedFile: {
    id: string
    name: string
    type: "folder" | "document"
    access_levels?: string[]
  } | null
  fullDocument?: any
  documentName?: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isMobile?: boolean
  executionId?: string | null
  executionInfo?: {
    id: string
    name: string
    status: string
    created_at: string
    formattedDate?: string
    isLatest?: boolean
  } | null
  lifecyclePermissions?: LifecyclePermissions
  stage?: string
  showTrigger?: boolean
}

export interface SectionsConfigExecution {
  id: string
  name?: string
  status?: string
  created_at?: string
}

export interface SectionsConfigSection extends SectionDependencyConfig {
  id: string
  name: string
  type?: "ai" | "manual" | "reference" | "form"
  prompt?: string
  order?: number
  dependencies?: Array<{ id: string; name: string }>
  manual_input?: string
  reference_section_id?: string
  reference_mode?: "latest" | "specific"
  reference_execution_id?: string
  not_in_execution?: boolean | null
  form_fields?: SectionFormField[]
  /**
   * Permiso de edición de esta sección ya resuelto por el backend para el usuario
   * actual (ver ContentSection.can_edit en src/types/assets/core.ts y
   * src/hooks/useDocumentSectionAccess.ts). `null`/ausente = no aplica, hereda del
   * documento.
   */
  can_edit?: boolean | null
}

export interface SectionsConfigResponse {
  template_id?: string | null
  document?: {
    id: string
    name: string
    description?: string
    template_id?: string | null
  }
  executions?: {
    active?: SectionsConfigExecution | null
    others?: SectionsConfigExecution[]
  }
  sections?: SectionsConfigSection[]
}

// ----------------------------------------
// Template Sheet
// ----------------------------------------

export interface TemplateConfigSheetProps {
  template: {
    id: string
    name: string
    description?: string
    template_sections?: SectionsConfigSection[]
  } | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

// ----------------------------------------
// Version Management Sheet
// ----------------------------------------

export interface ExecutionSummary {
  id: string
  name: string
  status: string
  created_at: string
  version?: string | null
  lifecycle_state?: string
}

export interface VersionManagementSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  executions: ExecutionSummary[]
  organizationId: string
  canEdit: boolean
  documentId: string
  /** The execution currently viewed in the document — used to pre-select the version */
  initialExecutionId?: string | null
}

export interface EditFormState {
  name: string
  expiration_date: string
  estimated_publication_date: string
  review_date: string
  audit_date: string
}

export interface ExecutionDetailProps {
  executionId: string
  organizationId: string
  canEdit: boolean
  onSaved: () => void
}
