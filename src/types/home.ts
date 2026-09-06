import type { ExecutionLifecycleState } from '@/types/execution';

/**
 * Clave de cada uno de los 4 grupos de la pestaña "Mi trabajo". `review`,
 * `approval` y `approved` tienen datos reales (ver `useMyWork`). `mentions`
 * sigue sin backend (Punto 5 de respuestas/spec-home-mi-trabajo-backend.md —
 * no hay menciones a usuarios en comentarios todavía) y no se renderiza.
 */
export type HomeWorkGroupKey = 'review' | 'approval' | 'mentions' | 'approved';

/**
 * Qué fecha justifica que una fila esté en su grupo, para la "razón temporal"
 * que se resalta en la fila (ver ia context — huemul-page-layout-guide no
 * aplica acá, esto es específico del rediseño de Home).
 * - `sinceLifecycleState`: `lifecycle_state_since` — entrada al estado actual,
 *   exacto de acá en adelante (backfill impreciso para transiciones viejas).
 *   Usado por los grupos "revisión" y "aprobación".
 * - `sinceUpdated`: fallback si `lifecycle_state_since` viniera ausente —
 *   `updated_at`, impreciso (cualquier edición de contenido lo mueve, no solo
 *   una transición de lifecycle).
 * - `estimatedPublicationDate`: fecha comprometida de publicación, usado por
 *   el grupo "aprobados".
 */
export type HomeWorkGroupTemporalKind = 'sinceLifecycleState' | 'sinceUpdated' | 'estimatedPublicationDate';

/** Una fila dentro de una `HomeWorkGroupCard`. */
export interface HomeWorkGroupRow {
  /** id de la ejecución (`Execution.id`), no del documento. */
  id: string;
  documentId: string;
  documentName: string;
  versionLabel: string | null;
  ownerName: string | null;
  lifecycleState: ExecutionLifecycleState;
  /** `current_lifecycle_step.step_name` — null cuando el estado no tiene steps configurables. */
  stepName: string | null;
  temporalDate: string | null;
  temporalKind: HomeWorkGroupTemporalKind | null;
}

/**
 * Conteo de un grupo de "Mi trabajo". `exact: true` cuando `GET /execution/`
 * devolvió `total` (siempre el caso acá — los 3 grupos nunca envían `query`).
 * `exact: false` queda solo como piso interino, hoy sin uso real en estos
 * grupos (ver el conteo de "Todos los activos" con búsqueda de texto activa,
 * que sí puede recibir `total: null`).
 */
export interface HomeWorkGroupCount {
  exact: boolean;
  value: number;
}

/**
 * Un activo abierto recientemente, para el rail "Continuar donde quedaste".
 * `lifecycleState` es `string` (no `ExecutionLifecycleState`) porque viene de
 * `LifecycleStatus.state` (`GET /documents/{id}/content`), que el propio
 * tipo declara como `string` suelto, no el union cerrado de `Execution`.
 */
export interface RecentAssetEntry {
  id: string;
  name: string;
  lifecycleState?: string;
  viewedAt: string;
}

/** Paso del checklist de "Puesta en marcha" (estado de primera vez del Home). */
export type OnboardingStepId = 'defaultLlm' | 'embeddingProvider' | 'assetType' | 'firstAsset' | 'inviteTeam';

export interface OnboardingStepState {
  id: OnboardingStepId;
  done: boolean;
}
