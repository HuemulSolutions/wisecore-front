// Lifecycle step component props for the asset type configuration module
import type { HTMLAttributes, MutableRefObject } from 'react'
import type { AssetTypeWithRoles } from './asset-types'
import type { AccessRuleType, AccessRuleTypeOption } from '@/types/lifecycle'

// ----------------------------------------
// Guardado batch de la etapa activa
// ----------------------------------------

/**
 * Contrato que expone el contenido de una etapa (`EditStepContent` /
 * `CreateStepContent`) hacia arriba: los controles quedan siempre editables y
 * los cambios se acumulan en estado local; el footer del sheet dispara `save()`.
 */
export interface LifecycleEditorApi {
  /** Persiste todo lo modificado en la etapa. */
  save: () => Promise<void>
  /** Hay cambios locales sin persistir. */
  isDirty: boolean
  /**
   * Descarta los cambios locales y vuelve al último estado del backend.
   * Necesario porque el contenedor (`assets-types-config-sheet.tsx`,
   * `assets-types-lifecycle-dialog.tsx`) marcaba `isDirty: false` en SU estado
   * al confirmar el descarte, sin limpiar el del editor: si la acción pendiente
   * no lo desmonta (cambio de tab con contenido montado, cierre del panel sin
   * cambiar de etapa), los cambios seguían vivos y el siguiente «Guardar
   * cambios» los persistía igual.
   *
   * Implementación esperada: limpiar los flags de sucio y dejar que el efecto
   * de rehidratación repueble el estado local desde la cache — no recomponer a
   * mano.
   */
  discard: () => void
}

/** API que `AssetTypeLifecyclePanel` publica en el ref del contenedor. */
export interface LifecycleSaveApi extends LifecycleEditorApi {
  isSaving: boolean
}

export type LifecycleSaveApiRef = MutableRefObject<LifecycleSaveApi | null>

// ----------------------------------------
// Create Step
// ----------------------------------------

export interface CreateStepContentProps {
  documentTypeId: string
  stepType: string
  /** Título mostrado en la cabecera de la tarjeta colapsable; cae a `step.name` cuando existe. */
  stepLabel?: string
  hasSla?: boolean
  hasValidity?: boolean
  noOwner?: boolean
  useAllOrCustomOwner?: boolean
  /** Publica `save`/`isDirty` hacia el footer del sheet. `null` al desmontar. */
  onRegisterEditor?: (api: LifecycleEditorApi | null) => void
  organizationId?: string
}

// ----------------------------------------
// Lifecycle Dialog
// ----------------------------------------

export interface DefaultStepContentProps {
  documentTypeId: string
  stepType: string
  stepLabel: string
}

export interface StepContentProps {
  documentTypeId: string
  stepType: string
  stepLabel: string
  onRegisterEditor?: (api: LifecycleEditorApi | null) => void
  organizationId?: string
  /** Alta de grupo disparada desde el header del panel (solo etapas con grupos). */
  addGroupSignal?: number
}

export interface AssetTypeLifecycleDialogProps {
  assetType: AssetTypeWithRoles | null
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId?: string
}

// ----------------------------------------
// Asset Lifecycle Sheet
// ----------------------------------------

export interface AssetLifecycleSheetProps {
  asset: { id: string; name: string; document_type_id: string | null } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ----------------------------------------
// Edit Step
// ----------------------------------------

export interface EditStepCardAccessRule {
  rule_type: AccessRuleType
  source_step_id: string | null
}

export interface EditStepCardData {
  id: string
  name: string
  mode: "manual" | "automatic"
  hasSla: boolean
  slaValue: string
  slaUnit: string
  accessType: "all" | "owner" | "custom" | "custom_owner"
  ownerCanExecute: boolean
  roleIds: string[]
  roleNames: Record<string, string>
  accessRules: EditStepCardAccessRule[]
}

export interface EditStepContentProps {
  documentTypeId: string
  stepType: string
  onRegisterEditor?: (api: LifecycleEditorApi | null) => void
  organizationId?: string
  /** Cada incremento abre el sheet de alta de grupo (lo dispara el header del panel). */
  addGroupSignal?: number
}

export interface EditStepCardProps {
  card: EditStepCardData
  stepType: string
  slaUnitOptions: { value: string; label: string }[]
  allRoles: { id: string; name: string }[]
  accessRuleTypeOptions: AccessRuleTypeOption[]
  /** Steps of this document type earlier in the pipeline than this card — candidates for step_actor_manager's source_step_id. */
  earlierStepOptions: { value: string; label: string }[]
  onChange: (updated: Partial<EditStepCardData>) => void
  onDelete: () => void
  t: (key: string, options?: Record<string, unknown>) => string
  canDelete: boolean
  canManage: boolean
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>
  organizationId?: string
  /** La tarjeta muestra el resumen (colapsada = solo cabecera). */
  isExpanded: boolean
  /** Controles editables — exclusivo entre tarjetas, lo gobierna `EditStepContent`. */
  isEditing: boolean
  /** Tiene cambios locales sin persistir («• Editado»). */
  isDirty: boolean
  onToggleExpand: () => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onDoneEdit: () => void
}

// ----------------------------------------
// Role permissions matrix
// ----------------------------------------

export interface AssetTypeLifecycleMatrixProps {
  documentTypeId: string
  /** Solo dispara el fetch de steps/roles cuando el tab/panel está visible. */
  enabled?: boolean
  /** Etapa del flujo seleccionada: tinta sus columnas y abre el panel lateral. */
  activeStageType: string | null
  /**
   * Etapa con cambios sin guardar en el panel: sus columnas quedan inertes para
   * que un toggle en la matriz no pise lo que está por persistirse.
   */
  lockedStageType?: string | null
  /** El usuario eligió una etapa (pastilla o engranaje de una de sus columnas). */
  onSelectStage: (stepType: string) => void
}

// ----------------------------------------
// Section permissions matrix
// ----------------------------------------

export interface TemplateSectionAccessMatrixProps {
  /** Plantilla cuyas secciones son las filas de la matriz. */
  templateId: string
  /** Tipo de activo cuyos steps del ciclo de vida son las columnas. */
  documentTypeId: string
  /** Solo dispara el fetch cuando la vista de configuración está visible. */
  enabled?: boolean
}

// ----------------------------------------
// Section conditions (depends_on a nivel de TemplateSection)
// ----------------------------------------

export interface TemplateSectionConditionsProps {
  /** Plantilla cuyas secciones se pueden condicionar. */
  templateId: string
  /** Solo dispara el fetch cuando la vista de configuración está visible. */
  enabled?: boolean
}

export interface LifecycleStepPanelProps {
  documentTypeId: string
  /** Tipo de etapa configurada (`edit`, `review`, `create`…). */
  stageType: string
  /** Cantidad de grupos (steps) de esta etapa, para el badge de la sección. */
  groupCount: number
  onClose: () => void
  onRegisterEditor?: (api: LifecycleEditorApi | null) => void
  organizationId?: string
}
