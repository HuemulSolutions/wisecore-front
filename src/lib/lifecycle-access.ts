import type { LifecycleAccessType, LifecycleInheritedRole, LifecycleStep } from "@/types/lifecycle"
import type { LifecyclePermissions, LifecycleStatus } from "@/types/assets"
import type { FinalLifecycleStage } from "@/types/document-types"

/**
 * Fuente única de verdad del pipeline del ciclo de vida y de la semántica de
 * `access_type`.
 *
 * Antes estaban duplicados y divergentes en tres componentes:
 * - `PIPELINE_ORDER`: `assets-types-lifecycle-matrix.tsx` incluía `"view"`,
 *   `assets-types-lifecycle-edit-step.tsx` no.
 * - `GROUPABLE_TYPES`: repetido en matrix, edit-step y step-panel.
 * - Derivación de `ownerCanExecute`: `edit-step.tsx` usaba
 *   `access_type === 'owner' || 'custom_owner'` (da `false` para `all`),
 *   `matrix.tsx` usaba `access_type !== 'custom'` (da `true` para `all`), y
 *   `create-step.tsx` colapsaba `owner` a `custom_owner` al hidratar.
 *
 * Mismo criterio que `src/lib/rbac-matrix.ts`: la constante de dominio vive en
 * `src/lib`, no en `src/types` (que es solo tipos) ni en un componente.
 */

// ─── Pipeline ────────────────────────────────────────────────────────────────

/**
 * Orden del flujo. Determina (a) el orden de pastillas y columnas de la
 * matriz y (b) qué steps son "anteriores" a otro — el backend valida lo mismo
 * para `source_step_id` de la regla `step_actor_manager`.
 *
 * Tipado como `readonly string[]` y no como tupla `as const`: todos los call
 * sites comparan contra `LifecycleStep["type"]`, que es `string`, y una tupla
 * literal obligaría a castear en cada `indexOf`/`includes`.
 */
export const LIFECYCLE_PIPELINE_ORDER: readonly string[] = [
  "create",
  "edit",
  "review",
  "approve",
  "publish",
  "archive",
  "view",
]

/**
 * Etapas con varios `LifecycleStep` por tipo (grupos) — mismo criterio que el
 * routing `EditStepContent` vs `CreateStepContent` de
 * `assets-types-lifecycle-dialog.tsx`.
 */
export const LIFECYCLE_GROUPABLE_TYPES: ReadonlySet<string> = new Set([
  "edit",
  "review",
  "approve",
])

export function isGroupableStepType(type: string): boolean {
  return LIFECYCLE_GROUPABLE_TYPES.has(type)
}

/** Posición en el pipeline, o `-1` si el tipo no está listado. */
export function pipelineIndex(type: string): number {
  return LIFECYCLE_PIPELINE_ORDER.indexOf(type)
}

/**
 * Tipos de step con mínimo de 1 (no se puede borrar el último) según la etapa
 * final configurada en el tipo de activo — mismo criterio que valida el
 * backend en `DELETE /lifecycle/steps/{id}`.
 */
export function getRequiredStepTypes(finalStage: FinalLifecycleStage): ReadonlySet<string> {
  if (finalStage === "edit") return new Set(["edit"])
  if (finalStage === "review") return new Set(["edit", "review"])
  return new Set(["edit", "approve"]) // approve | publish — comportamiento actual
}

/** Posición para ordenar: los tipos desconocidos van al final, no al principio. */
export function pipelineSortIndex(type: string): number {
  const idx = pipelineIndex(type)
  return idx === -1 ? LIFECYCLE_PIPELINE_ORDER.length : idx
}

/**
 * Tipos de step con permiso POR SECCIÓN de plantilla (matriz sección × step de
 * `GET /templates/{id}/lifecycle_access_matrix`). `create`/`publish`/`archive`
 * quedan fuera: son transiciones automáticas o ligadas al creador del documento,
 * no tiene sentido darles acceso sección por sección.
 *
 * OJO: NO es «los tipos configurables en cualquier pantalla de permisos». La
 * matriz de permisos por rol del tipo de activo
 * (`assets-types-lifecycle-matrix.tsx`) muestra TODAS las etapas que devuelve
 * `GET /lifecycle/document-types/{id}/steps`, las siete incluidas.
 */
export const SECTION_PERMISSION_STEP_TYPES: ReadonlySet<string> = new Set([
  "view",
  "edit",
  "review",
  "approve",
])

export function isSectionPermissionStepType(type: string): boolean {
  return SECTION_PERMISSION_STEP_TYPES.has(type)
}

// ─── Herencia de `view` ──────────────────────────────────────────────────────

/**
 * Steps desde los que puede heredarse `view` real. `create`/`publish`/`archive`
 * NO cuentan como fuente — el backend solo propaga desde estos tres.
 */
export const VIEW_INHERITANCE_SOURCE_TYPES: ReadonlySet<string> = new Set([
  "edit",
  "review",
  "approve",
])

/**
 * Entrada de herencia de un rol puntual en el step `view`, o `null` si ese rol
 * no hereda (puede seguir viendo el documento por `view_inherited_for_all_roles`,
 * que no tiene entrada por rol — usar `isViewInheritedForRole` para el booleano).
 */
export function inheritedViewSource(
  step: Pick<LifecycleStep, "inherited_roles">,
  roleId: string,
): LifecycleInheritedRole | null {
  return step.inherited_roles?.find((r) => r.role_id === roleId) ?? null
}

/**
 * `true` si este rol ya tiene `view` real sin necesidad de una fila propia en el
 * step `view` — por `view_inherited_for_all_roles` (algún step `edit`/`review`/
 * `approve` con `access_type: "all"`) o por estar en `inherited_roles`. La celda
 * correspondiente debe pintarse marcada y bloqueada: desmarcarla no revoca nada.
 */
export function isViewInheritedForRole(
  step: Pick<LifecycleStep, "inherited_roles" | "view_inherited_for_all_roles">,
  roleId: string,
): boolean {
  return step.view_inherited_for_all_roles === true || inheritedViewSource(step, roleId) !== null
}

// ─── Stepper de fases (progreso visual) ──────────────────────────────────────

/**
 * Hitos del stepper de fases del diálogo de completar/aprobar/publicar.
 * Mezcla `type` de step (create/edit/review/approve) con `state` terminal
 * (approved/published) a propósito: "Aprobado"/"Publicado" no son steps
 * configurables, son el estado que resulta de completar el último step de
 * approve/publish — así lo muestra el diseño.
 */
export const LIFECYCLE_MILESTONES: readonly string[] = [
  "create",
  "edit",
  "review",
  "approve",
  "approved",
  "published",
]

/**
 * Recorta los hitos según hasta dónde llega el tipo de activo
 * (`final_lifecycle_stage`) y qué stages tienen al menos un step configurado
 * (`presentStageTypes`, de `useAllLifecycleSteps`). Los hitos terminales
 * (`approved`/`published`) siempre se muestran cuando entran en el recorte:
 * no son steps, así que no tienen entrada propia en `presentStageTypes`.
 */
export function getLifecycleMilestones(
  finalStage: FinalLifecycleStage,
  presentStageTypes: ReadonlySet<string>,
): readonly string[] {
  const upperBound = finalStage === "publish" ? "published" : finalStage === "approve" ? "approved" : finalStage
  const cutoffIndex = LIFECYCLE_MILESTONES.indexOf(upperBound)
  const bounded = cutoffIndex === -1 ? LIFECYCLE_MILESTONES : LIFECYCLE_MILESTONES.slice(0, cutoffIndex + 1)
  return bounded.filter(
    (milestone) => milestone === "approved" || milestone === "published" || presentStageTypes.has(milestone),
  )
}

/**
 * Hito del stepper que representa una etapa de runtime (`LifecycleStatus.stage`).
 * `publish`/`archive` son acciones, no hitos: publicar se dispara desde el hito
 * "Aprobado" y archivar desde "Publicado". Sin esta normalización el stepper del
 * sheet de publicación marcaba "Publicado" como fase actual (el `indexOf` de
 * `stage: "publish"` daba `-1` y caía al último hito).
 */
export function milestoneForStage(stage: string): string {
  if (stage === "publish") return "approved"
  if (stage === "archive") return "published"
  return stage
}

// ─── Estados terminales ──────────────────────────────────────────────────────

/**
 * Estados en los que la ejecución ya terminó su flujo: el backend rechaza toda
 * escritura con `EXECUTION_LIFECYCLE_LOCKED` (409). `finalized` es el terminal
 * de los tipos de activo no-ISO (`requires_iso_strict_versioning: false`) con
 * `final_lifecycle_stage` distinto de `"publish"`; `archived` sigue siendo el
 * del flujo completo (`publish`) o el archivado manual explícito.
 */
export const TERMINAL_LIFECYCLE_STATES: ReadonlySet<string> = new Set([
  "published",
  "archived",
  "finalized",
])

export function isTerminalLifecycleState(state: string | undefined): boolean {
  return !!state && TERMINAL_LIFECYCLE_STATES.has(state)
}

/**
 * Estados cuyo label de `lifecycle.stateLabels` encaja gramaticalmente embebido en
 * "Este activo está {label}" / "This asset is {label}". `draft` queda fuera a
 * propósito ("está elaboración" no es frase) — para esos se usa el aviso genérico.
 */
export const READ_ONLY_NOTICE_STATES: ReadonlySet<string> = new Set([
  "in_review",
  "in_approval",
  "approved",
  "published",
  "archived",
  "finalized",
])

/** Estados desde los que `POST /execution-lifecycle/{id}/restore` está habilitado. */
export const RESTORABLE_LIFECYCLE_STATES: ReadonlySet<string> = new Set([
  "archived",
  "finalized",
])

export function isRestorableLifecycleState(state: string | undefined): boolean {
  return !!state && RESTORABLE_LIFECYCLE_STATES.has(state)
}

// ─── Visibilidad de las acciones de ciclo de vida ────────────────────────────

/** Qué botones ofrece `HuemulLifecycleActions` para un documento y usuario dados. */
export interface LifecycleActionsVisibility {
  canReturn: boolean
  canComplete: boolean
  canPublish: boolean
  canArchive: boolean
  canRestore: boolean
  canRerunExternalPublish: boolean
  /** Ninguna acción disponible: el contenedor no se pinta (ver `HuemulLifecycleActions`). */
  hasAny: boolean
}

/**
 * Única tabla de verdad de qué transiciones se ofrecen. Puro (sin `t` ni React),
 * mismo criterio que `resolveWorkflowFinishOutcome`: además de alimentar el
 * render de `HuemulLifecycleActions`, deja que una superficie pregunte ANTES de
 * renderizar si le va a quedar algo en la barra — el panel de workflow oculta
 * toda la fila de ciclo de vida cuando el usuario ya no tiene nada por hacer y
 * tampoco queda ninguna acción.
 *
 * Cruce lifecycle × RBAC: sin `asset:u` (`canTransition`) ninguna transición se
 * ofrece, aunque el grant del documento —o `status.can_advance`, que viene del
 * backend y no del objeto de permisos— diga que sí. Ver ia context/rbac-audit-guide.md.
 */
export function resolveLifecycleActionsVisibility(input: {
  status?: LifecycleStatus | null
  permissions?: LifecyclePermissions | null
  canTransition: boolean
  finalLifecycleStage: FinalLifecycleStage
  /** `useLifecycleActions.isBlockedByRequiredAnswers`: el botón se muestra deshabilitado, no se oculta. */
  isBlockedByRequiredAnswers?: boolean
  showRerunExternalPublish?: boolean
  hideComplete?: boolean
}): LifecycleActionsVisibility {
  const { status, permissions, canTransition, finalLifecycleStage } = input

  if (!status || !canTransition) {
    return {
      canReturn: false,
      canComplete: false,
      canPublish: false,
      canArchive: false,
      canRestore: false,
      canRerunExternalPublish: false,
      hasAny: false,
    }
  }

  const canReturn = !!status.can_rollback
  const canComplete = (!!status.can_advance || !!input.isBlockedByRequiredAnswers) && !input.hideComplete
  // Con etapa final distinta de "publish" (campo `final_lifecycle_stage` del
  // tipo de activo) el documento nunca llega a publicarse: al aprobar, la
  // ejecución se archiva directo.
  const canPublish = !!permissions?.publish && status.state === "approved" && finalLifecycleStage === "publish"
  const canArchive = !!permissions?.archive && (status.state === "approved" || status.state === "published")
  const canRestore = !!permissions?.archive && isRestorableLifecycleState(status.state)
  const canRerunExternalPublish =
    !!input.showRerunExternalPublish && !!permissions?.publish && status.state === "published"

  return {
    canReturn,
    canComplete,
    canPublish,
    canArchive,
    canRestore,
    canRerunExternalPublish,
    hasAny: canReturn || canComplete || canPublish || canArchive || canRestore || canRerunExternalPublish,
  }
}

// ─── Semántica de access_type ────────────────────────────────────────────────

/** El propietario ejecuta el paso salvo que el acceso sea exclusivamente por roles. */
export function ownerCanExecute(accessType: LifecycleAccessType): boolean {
  return accessType !== "custom"
}

/** Toda la organización puede ejecutar; implica propietario y hace irrelevantes roles y reglas. */
export function allowsAnyone(accessType: LifecycleAccessType): boolean {
  return accessType === "all"
}

/**
 * Única tabla de verdad del enum. `anyone` es excluyente; sin roles nunca se
 * emite `custom` (dejaría el paso sin ningún ejecutor posible).
 */
export function deriveAccessType(input: {
  anyone: boolean
  owner: boolean
  roleCount: number
}): LifecycleAccessType {
  if (input.anyone) return "all"
  if (input.roleCount === 0) return "owner"
  return input.owner ? "custom_owner" : "custom"
}

// ─── Payload de access_type + role_ids ───────────────────────────────────────

/**
 * `role_ids` solo tiene sentido —y solo lo acepta el backend— cuando el acceso
 * se define por roles. Fuera de `custom`/`custom_owner` el PATCH responde 422
 * ("role_ids can only be updated when access_type is custom or custom_owner"),
 * incluso mandando `[]`: la clave no puede estar presente, no basta con vaciarla.
 */
export function usesRoleList(accessType: LifecycleAccessType): boolean {
  return accessType === "custom" || accessType === "custom_owner"
}

/**
 * Único constructor del par `access_type` + `role_ids` de los payloads de step.
 * Omite `role_ids` cuando el acceso resultante no es por roles; los `step_roles`
 * que queden en el servidor son inertes (ver `stepRoleIds`).
 *
 * El tipo de retorno se escribe explícito —y no como `Pick<UpdateLifecycleStepData, …>`—
 * para servir igual al PATCH y al POST de creación sin acoplar `src/lib` a dos interfaces.
 */
export function buildAccessPayload(input: {
  accessType: LifecycleAccessType
  roleIds: string[]
}): { access_type: LifecycleAccessType; role_ids?: string[] } {
  return usesRoleList(input.accessType)
    ? { access_type: input.accessType, role_ids: input.roleIds }
    : { access_type: input.accessType }
}

/** Deriva el `access_type` desde los toggles y arma el payload en un solo paso. */
export function buildAccessPatch(input: {
  anyone: boolean
  owner: boolean
  roleIds: string[]
}): { access_type: LifecycleAccessType; role_ids?: string[] } {
  return buildAccessPayload({
    accessType: deriveAccessType({
      anyone: input.anyone,
      owner: input.owner,
      roleCount: input.roleIds.length,
    }),
    roleIds: input.roleIds,
  })
}

/**
 * Roles VIGENTES de un step. Fuera de `custom`/`custom_owner` el backend ignora
 * `step_roles` y el PATCH ni siquiera permite limpiarlos, así que los residuales
 * son inertes: no se pintan, no se cuentan y no se reenvían. Sin este filtro, un
 * paso `owner` con roles residuales se degrada solo a `custom` al tocar la celda
 * de propietario en la matriz.
 */
export function stepRoleIds(step: Pick<LifecycleStep, "access_type" | "step_roles">): string[] {
  return usesRoleList(step.access_type) ? step.step_roles.map((r) => r.role_id) : []
}
