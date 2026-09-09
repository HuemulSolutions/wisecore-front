// Lifecycle step component props for the asset type configuration module
import type { MutableRefObject } from 'react'
import type { AssetTypeWithRoles } from './asset-types'
import type { AccessRuleType, LifecycleAccessType, LifecycleStep } from '@/types/lifecycle'

// ----------------------------------------
// Guardado batch del sheet de step
// ----------------------------------------

/**
 * Contrato que expone el sheet de step (`useLifecycleStepDraft`) hacia arriba:
 * los controles quedan siempre editables y los cambios se acumulan en estado
 * local; el footer del sheet contenedor dispara `save()`.
 */
export interface LifecycleEditorApi {
  /** Persiste todo lo modificado del step. */
  save: () => Promise<void>
  /** Hay cambios locales sin persistir. */
  isDirty: boolean
  /**
   * Descarta los cambios locales y vuelve al último estado del backend.
   * Implementación esperada: limpiar los flags de sucio y dejar que el efecto
   * de rehidratación repueble el estado local desde la cache — no recomponer
   * a mano.
   */
  discard: () => void
}

/** API que `AssetTypeLifecyclePanel` publica en el ref del contenedor. */
export interface LifecycleSaveApi extends LifecycleEditorApi {
  isSaving: boolean
}

export type LifecycleSaveApiRef = MutableRefObject<LifecycleSaveApi | null>

// ----------------------------------------
// Lifecycle Dialog
// ----------------------------------------

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
// Sheet mono-entidad de step/grupo
// ----------------------------------------

/** Regla de acceso en edición local (aún no persistida). */
export interface LifecycleAccessRuleDraft {
  rule_type: AccessRuleType
  source_step_id: string | null
}

/**
 * A qué apunta el sheet — determina el modo: edición de un grupo existente,
 * edición de una etapa simple de step único, o alta de un grupo nuevo. Nunca
 * "todos los grupos de la etapa": el sheet es mono-entidad (ver
 * `ia context` — rediseño del sheet de ciclo de vida).
 */
export type LifecycleStepSheetTarget =
  | { mode: 'edit'; stepId: string }
  | { mode: 'stage'; stageType: string }
  | { mode: 'create'; stageType: string }

/** Borrador de identidad + configuración de UN step, editable de una vez. */
export interface LifecycleStepDraftData {
  name: string
  mode: 'manual' | 'automatic'
  hasSla: boolean
  slaValue: string
  slaUnit: string
  accessType: LifecycleAccessType
  ownerCanExecute: boolean
  roleIds: string[]
  roleNames: Record<string, string>
  accessRules: LifecycleAccessRuleDraft[]
  /** Índice 0-based dentro de los hermanos de la etapa, ordenados por `order`. */
  positionIndex: number
}

export interface UseLifecycleStepDraftOptions {
  documentTypeId: string
  target: LifecycleStepSheetTarget | null
  enabled: boolean
  organizationId?: string
  /** Nombre de respaldo para un grupo nuevo sin nombre propio (`t("lifecycle.newGroupName")`). */
  fallbackGroupName: string
  /** Mensaje de error genérico de guardado/borrado (`t("lifecycle.saveError")`). */
  saveErrorMessage: string
  /** Mensaje de éxito al guardar (`t("lifecycle.savedSuccess")`). */
  savedSuccessMessage: string
  /** El grupo recién creado pasa el sheet a modo edición con el id real. */
  onCreated: (stepId: string) => void
}

// ----------------------------------------
// Role permissions matrix
// ----------------------------------------

export interface AssetTypeLifecycleMatrixProps {
  documentTypeId: string
  /** Solo dispara el fetch de steps/roles cuando el tab/panel está visible. */
  enabled?: boolean
  /** Pastilla de etapa activa: resalta y filtra sus columnas (ya no abre el sheet). */
  filterStageType: string | null
  onFilterStage: (stepType: string) => void
  /** Step con cambios sin guardar en el sheet: su columna queda inerte para
   * que un toggle en la matriz no pise lo que está por persistirse. */
  lockedStepId?: string | null
  /** Step enfocado por el sheet abierto — tinta su columna y su engranaje como activos. */
  focusedStepId?: string | null
  /** Engranaje de una columna de grupo: abre el sheet en modo edición de ese step. */
  onConfigureStep: (step: LifecycleStep) => void
  /** Engranaje del header de una etapa sin grupos: abre el sheet en modo etapa simple. */
  onConfigureStage: (stepType: string) => void
  /** «＋» del encabezado de una etapa agrupable: abre el sheet en modo alta. */
  onCreateGroup: (stepType: string) => void
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
