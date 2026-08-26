import type {
  ExternalFunctionalityHttpMethod,
  ExternalFunctionalityExecutionType,
  ExternalFunctionalityClass,
  ExternalFunctionalityObjective,
} from '@/types/external-functionalities'

export interface LifecycleStepType {
  value: string;
  label: string;
}

export interface LifecycleStepTypesResponse {
  data: LifecycleStepType[];
  transaction_id: string;
  page: null;
  page_size: null;
  has_next: null;
  timestamp: string;
}

export interface LifecycleStepRole {
  role_id: string;
  role_name?: string;
}

// ─── Access rules (creator / manager-based access) ──────────────────────────

export type AccessRuleType = 'creator' | 'creator_manager' | 'owner_manager' | 'step_actor_manager';

export interface AccessRuleTypeOption {
  value: AccessRuleType;
  label: string;
}

export interface AccessRuleTypesResponse {
  data: AccessRuleTypeOption[];
  transaction_id: string;
  timestamp: string;
}

export interface LifecycleAccessRule {
  id: string;
  rule_type: AccessRuleType;
  source_step_id: string | null;
}

export interface CreateAccessRuleData {
  rule_type: AccessRuleType;
  source_step_id?: string | null;
}

export interface LifecycleAccessRuleResponse {
  data: LifecycleStep;
  transaction_id: string;
  timestamp: string;
}

/**
 * `all` = toda la organización (implica propietario, hace irrelevantes roles y
 * reglas); `owner` = solo el propietario; `custom` = solo los roles listados
 * (propietario excluido); `custom_owner` = roles listados OR propietario.
 * Única fuente de verdad de la semántica: `src/lib/lifecycle-access.ts`.
 */
export type LifecycleAccessType = 'all' | 'owner' | 'custom' | 'custom_owner';

/**
 * Rol con `view` real por herencia de otro step (`edit`/`review`/`approve`),
 * sin fila propia en el step `view`. Solo llega dentro de `LifecycleStep.inherited_roles`
 * del step de tipo `view`. Ver "ia context/permisos-seccion-lifecycle-guide.md".
 */
export interface LifecycleInheritedRole {
  role_id: string;
  source_step_id: string;
  source_step_type: string;
  source_step_name: string | null;
}

export interface LifecycleStep {
  id: string;
  document_type_id: string;
  type: string;
  name: string | null;
  order: number | null;
  mode: 'manual' | 'automatic';
  access_type: LifecycleAccessType;
  valid_from: string | null;
  valid_to: string | null;
  sla_value: number | null;
  sla_unit: string | null;
  step_roles: LifecycleStepRole[];
  access_rules: LifecycleAccessRule[];
  /**
   * Roles con `view` real por tener acceso a `edit`/`review`/`approve`, sin fila
   * propia en `step_roles` de este step. Vacío/ausente en steps que no son `view`.
   */
  inherited_roles?: LifecycleInheritedRole[];
  /**
   * `true` si algún step `edit`/`review`/`approve` tiene `access_type: "all"` —
   * en ese caso `view` queda heredado para TODOS los roles de la organización
   * (el backend no tiene el catálogo completo para enumerarlos uno por uno).
   * Ausente/`false` en steps que no son `view`.
   */
  view_inherited_for_all_roles?: boolean;
}

export interface LifecycleStepsResponse {
  data: {
    document_type_id: string;
    steps: LifecycleStep[];
  };
  transaction_id: string;
  page: null;
  page_size: null;
  has_next: null;
  timestamp: string;
}

export interface UpdateLifecycleStepData {
  access_type?: LifecycleAccessType;
  name?: string;
  order?: number;
  mode?: 'manual' | 'automatic';
  valid_from?: string | null;
  valid_to?: string | null;
  sla_value?: number | null;
  sla_unit?: string | null;
  role_ids?: string[];
  /** Replaces the step's full access_rules list — same semantics as role_ids. */
  access_rules?: CreateAccessRuleData[];
}

export interface SlaUnit {
  value: string;
  label: string;
}

export interface SlaUnitsResponse {
  data: SlaUnit[];
  transaction_id: string;
  page: null;
  page_size: null;
  has_next: null;
  timestamp: string;
}

export interface CreateLifecycleStepData {
  type: string;
  name?: string;
  order?: number;
  mode?: 'manual' | 'automatic';
  access_type?: string;
  valid_from?: string | null;
  valid_to?: string | null;
  sla_value?: number | null;
  sla_unit?: string | null;
  role_ids?: string[];
  access_rules?: CreateAccessRuleData[];
}

export interface LifecycleStepResponse {
  data: LifecycleStep;
  transaction_id: string;
  timestamp: string;
}

// ─── Document grants ─────────────────────────────────────────────────────────

export interface LifecycleDocumentGrant {
  id: string;
  user_id: string;
  granted_by: string;
  created_at: string;
}

export interface LifecycleDocumentGrantSkip {
  user_id: string;
  reason: string;
}

export interface LifecycleDocumentGrantsResponse {
  transaction_id: string;
  data: {
    document_id: string;
    lifecycle_step_id: string;
    grants: LifecycleDocumentGrant[];
  };
}

export interface GrantLifecycleDocumentResponse {
  transaction_id: string;
  data: {
    document_id: string;
    lifecycle_step_id: string;
    created: LifecycleDocumentGrant[];
    skipped: LifecycleDocumentGrantSkip[];
  };
}

export interface RevokeLifecycleDocumentResponse {
  transaction_id: string;
  data: {
    document_id: string;
    lifecycle_step_id: string;
    revoked: LifecycleDocumentGrant[];
    skipped: LifecycleDocumentGrantSkip[];
  };
}

export interface GrantLifecycleDocumentRequest {
  lifecycle_step_id: string;
  user_ids: string[];
}

export interface RevokeLifecycleDocumentRequest {
  lifecycle_step_id: string;
  user_ids: string[];
}

// ─── External Publish Actions ─────────────────────────────────────────────────

export interface ExternalPublishActionFunctionality {
  id: string
  name: string
  description: string
  partial_url: string
  http_method: ExternalFunctionalityHttpMethod
  objective: ExternalFunctionalityObjective
  execution_type: ExternalFunctionalityExecutionType
  functionality_class: ExternalFunctionalityClass
  system: {
    id: string
    name: string
    status: string
  }
}

export interface ExternalPublishAction {
  id: string
  lifecycle_step_id: string
  external_functionality_id: string
  external_functionality_name?: string
  external_functionality?: ExternalPublishActionFunctionality
  execution_order: number
  is_enabled: boolean
  stop_on_error: boolean
  created_at: string
  updated_at: string
}

export interface ExternalPublishActionsResponse {
  data: ExternalPublishAction[]
  transaction_id: string
  timestamp: string
}

export interface ExternalPublishActionResponse {
  data: ExternalPublishAction
  transaction_id: string
  timestamp: string
}

export interface CreateExternalPublishActionRequest {
  external_functionality_id: string
  execution_order: number
  is_enabled: boolean
  stop_on_error: boolean
}

export interface UpdateExternalPublishActionRequest {
  external_functionality_id?: string
  execution_order?: number
  is_enabled?: boolean
  stop_on_error?: boolean
}

export interface ReorderExternalPublishActionsRequest {
  actions: Array<{
    id: string
    execution_order: number
  }>
}

export interface ExternalPublishRun {
  id: string
  status: 'pending' | 'running' | 'completed' | 'completed_with_errors' | 'failed'
  total_actions: number
  successful_actions: number
  failed_actions: number
  trigger_mode: string
  triggered_by_user_id: string
  started_at: string | null
  finished_at: string | null
}

export interface AdvanceLifecycleResponse {
  execution_id: string
  previous_state: string
  new_state: string
  external_publish: ExternalPublishRun | null
}

// ─── External Review Actions ──────────────────────────────────────────────────

export interface ExternalReviewActionFunctionality {
  id: string
  name: string
  description: string
  partial_url: string
  http_method: ExternalFunctionalityHttpMethod
  objective: ExternalFunctionalityObjective
  execution_type: ExternalFunctionalityExecutionType
  functionality_class: ExternalFunctionalityClass
  system: {
    id: string
    name: string
    status: string
  }
}

export interface ExternalReviewAction {
  id: string
  lifecycle_step_id: string
  external_functionality_id: string
  external_functionality_name?: string
  external_functionality?: ExternalReviewActionFunctionality
  execution_order: number
  is_enabled: boolean
  stop_on_error: boolean
  created_at: string
  updated_at: string
}

export interface ExternalReviewActionsResponse {
  data: ExternalReviewAction[]
  transaction_id: string
  timestamp: string
}

export interface ExternalReviewActionResponse {
  data: ExternalReviewAction
  transaction_id: string
  timestamp: string
}

export interface CreateExternalReviewActionRequest {
  external_functionality_id: string
  execution_order: number
  is_enabled?: boolean
  stop_on_error?: boolean
}

export interface UpdateExternalReviewActionRequest {
  external_functionality_id?: string
  execution_order?: number
  is_enabled?: boolean
  stop_on_error?: boolean
}

export interface ReorderExternalReviewActionsRequest {
  actions: Array<{
    id: string
    execution_order: number
  }>
}

export interface ExternalReviewRun {
  id: string
  execution_id: string
  document_id: string
  lifecycle_step_id: string
  triggered_by_user_id: string
  trigger_mode: string
  status: 'pending' | 'running' | 'completed' | 'completed_with_errors' | 'failed'
  total_actions: number
  successful_actions: number
  failed_actions: number
  started_at: string | null
  finished_at: string | null
  error_detail: string | null
}

export interface CompleteLifecycleStepExternalReview {
  review_run: ExternalReviewRun | null
  job: { id: string } | null
  actions_enqueued: number
}

export interface CompleteLifecycleStepResponse {
  step_id: string
  completed_by: string
  completed_at: string
  remaining_steps: number
  all_steps_completed: boolean
  next_step: string | null
  auto_advanced: boolean
  new_state: string
  external_review?: CompleteLifecycleStepExternalReview
}
