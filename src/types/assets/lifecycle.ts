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
}

/** API que `AssetTypeLifecyclePanel` publica en el ref del contenedor. */
export interface LifecycleSaveApi extends LifecycleEditorApi {
  isSaving: boolean
}

export type LifecycleSaveApiRef = MutableRefObject<LifecycleSaveApi | null>

// ----------------------------------------
// Config Step
// ----------------------------------------

export interface ConfigStepContentProps {
  documentTypeId: string
  stepType: string
  stepLabel: string
  hasSla: boolean
  hasValidity?: boolean
  onRegisterSave?: (fn: (() => Promise<void>) | null, isPending: boolean) => void
  onEditingChange?: (isEditing: boolean) => void
}

// ----------------------------------------
// Create Step
// ----------------------------------------

export interface CreateStepContentProps {
  documentTypeId: string
  stepType: string
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
