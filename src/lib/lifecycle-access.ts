import type { LifecycleAccessType, LifecycleInheritedRole, LifecycleStep } from "@/types/lifecycle"
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
 * Tipos configurables en las dos pantallas de permisos («Permisos por rol» y la
 * matriz de plantilla). `create`/`publish`/`archive` siguen existiendo en el
 * ciclo de vida del `document_type` —y en `LIFECYCLE_PIPELINE_ORDER`— pero el
 * backend ya no los devuelve en `GET /lifecycle/document-types/{id}/steps` ni en
 * `GET /templates/{id}/lifecycle_access_matrix`: son transiciones automáticas o
 * ligadas al creador del documento, no tiene sentido asignarles roles ahí.
 */
export const LIFECYCLE_PERMISSION_STEP_TYPES: ReadonlySet<string> = new Set([
  "view",
  "edit",
  "review",
  "approve",
])

export function isPermissionStepType(type: string): boolean {
  return LIFECYCLE_PERMISSION_STEP_TYPES.has(type)
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

/** Estados desde los que `POST /execution-lifecycle/{id}/restore` está habilitado. */
export const RESTORABLE_LIFECYCLE_STATES: ReadonlySet<string> = new Set([
  "archived",
  "finalized",
])

export function isRestorableLifecycleState(state: string | undefined): boolean {
  return !!state && RESTORABLE_LIFECYCLE_STATES.has(state)
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
