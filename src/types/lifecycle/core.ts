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

export interface LifecycleStep {
  id: string;
  document_type_id: string;
  type: string;
  name: string | null;
  order: number | null;
  access_type: 'all' | 'owner' | 'custom' | 'custom_owner';
  valid_from: string | null;
  valid_to: string | null;
  sla_value: number | null;
  sla_unit: string | null;
  step_roles: LifecycleStepRole[];
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
  access_type?: 'all' | 'owner' | 'custom' | 'custom_owner';
  name?: string;
  order?: number;
  valid_from?: string | null;
  valid_to?: string | null;
  sla_value?: number | null;
  sla_unit?: string | null;
  role_ids?: string[];
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
  access_type?: string;
  valid_from?: string | null;
  valid_to?: string | null;
  sla_value?: number | null;
  sla_unit?: string | null;
  role_ids?: string[];
}

export interface LifecycleStepResponse {
  data: LifecycleStep;
  transaction_id: string;
  timestamp: string;
}
