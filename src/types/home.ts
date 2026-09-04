import type { ExecutionLifecycleState } from '@/types/execution';

/**
 * Clave de cada uno de los 4 grupos de la pestaña "Mi trabajo". Solo `approved`
 * tiene datos reales hoy — los otros 3 dependen de backend (ver
 * respuestas/spec-home-mi-trabajo-backend.md, Puntos 1 y 5) y quedan
 * declarados pero deshabilitados en `home-my-work-tab.tsx`.
 */
export type HomeWorkGroupKey = 'review' | 'approval' | 'mentions' | 'approved';

/**
 * Qué fecha justifica que una fila esté en su grupo, para la "razón temporal"
 * que se resalta en la fila (ver ia context — huemul-page-layout-guide no
 * aplica acá, esto es específico del rediseño de Home).
 * - `sinceUpdated`: no hay `lifecycle_state_since` en el backend todavía
 *   (spec Punto 6), se aproxima con `updated_at` — impreciso a propósito, se
 *   documenta en el componente que lo consume.
 * - `estimatedPublicationDate`: fecha comprometida de publicación.
 */
export type HomeWorkGroupTemporalKind = 'sinceUpdated' | 'estimatedPublicationDate';

/** Una fila dentro de una `HomeWorkGroupCard`. */
export interface HomeWorkGroupRow {
  /** id de la ejecución (`Execution.id`), no del documento. */
  id: string;
  documentId: string;
  documentName: string;
  versionLabel: string | null;
  ownerName: string | null;
  lifecycleState: ExecutionLifecycleState;
  temporalDate: string | null;
  temporalKind: HomeWorkGroupTemporalKind | null;
}

/**
 * Conteo interino de un grupo mientras `GET /execution/` no expone `total`
 * (spec Punto 2). `exact: false` significa que la página trajo `has_next` y
 * el número mostrado es un piso, no el total real — nunca se debe restar
 * contra ese número para "Ver las N restantes".
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
