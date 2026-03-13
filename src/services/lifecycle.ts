import { httpClient } from '@/lib/http-client';
import { backendUrl } from '@/config';

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
  access_type: 'all' | 'owner' | 'custom';
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
  access_type?: 'all' | 'owner' | 'custom';
  name?: string;
  order?: number;
  valid_from?: string | null;
  valid_to?: string | null;
  sla_value?: number | null;
  sla_unit?: string | null;
  role_ids?: string[];
}

export async function getLifecycleStepTypes(): Promise<LifecycleStepTypesResponse> {
  const response = await httpClient.fetch(`${backendUrl}/lifecycle/step-types`);
  return response.json();
}

export async function getLifecycleSteps(
  documentTypeId: string,
  stepType?: string
): Promise<LifecycleStepsResponse> {
  const params = new URLSearchParams();
  if (stepType) params.set('step_type', stepType);
  const query = params.toString() ? `?${params}` : '';
  const response = await httpClient.get(
    `${backendUrl}/lifecycle/document-types/${documentTypeId}/steps${query}`
  );
  return response.json();
}

export async function updateLifecycleStep(
  stepId: string,
  data: UpdateLifecycleStepData
): Promise<void> {
  await httpClient.patch(`${backendUrl}/lifecycle/steps/${stepId}`, data);
}

export async function addRoleToStep(stepId: string, roleId: string): Promise<void> {
  await httpClient.post(`${backendUrl}/lifecycle/steps/${stepId}/roles`, { role_id: roleId });
}

export async function removeRoleFromStep(stepId: string, roleId: string): Promise<void> {
  await httpClient.delete(`${backendUrl}/lifecycle/steps/${stepId}/roles/${roleId}`);
}

// ─── SLA Units ──────────────────────────────────────────────────────────────

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

export async function getSlaUnits(): Promise<SlaUnitsResponse> {
  const response = await httpClient.get(`${backendUrl}/lifecycle/sla-units`);
  return response.json();
}

// ─── Create / Delete step ────────────────────────────────────────────────────

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

export async function createLifecycleStep(
  documentTypeId: string,
  data: CreateLifecycleStepData
): Promise<LifecycleStepResponse> {
  const response = await httpClient.post(
    `${backendUrl}/lifecycle/document-types/${documentTypeId}/steps`,
    data
  );
  return response.json();
}

export async function deleteLifecycleStep(stepId: string): Promise<void> {
  await httpClient.delete(`${backendUrl}/lifecycle/steps/${stepId}`);
}
