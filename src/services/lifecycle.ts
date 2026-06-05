import { httpClient } from '@/lib/http-client';
import { backendUrl } from '@/config';
import type { LifecycleStepType, LifecycleStepTypesResponse, LifecycleStepRole, LifecycleStep, LifecycleStepsResponse, UpdateLifecycleStepData, SlaUnit, SlaUnitsResponse, CreateLifecycleStepData, LifecycleStepResponse, LifecycleDocumentGrant, LifecycleDocumentGrantsResponse, GrantLifecycleDocumentRequest, GrantLifecycleDocumentResponse, RevokeLifecycleDocumentRequest, RevokeLifecycleDocumentResponse } from '@/types/lifecycle';

export type { LifecycleStepType, LifecycleStepTypesResponse, LifecycleStepRole, LifecycleStep, LifecycleStepsResponse, UpdateLifecycleStepData, SlaUnit, SlaUnitsResponse, CreateLifecycleStepData, LifecycleStepResponse, LifecycleDocumentGrant, LifecycleDocumentGrantsResponse, GrantLifecycleDocumentRequest, GrantLifecycleDocumentResponse, RevokeLifecycleDocumentRequest, RevokeLifecycleDocumentResponse };

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

export async function getSlaUnits(): Promise<SlaUnitsResponse> {
  const response = await httpClient.get(`${backendUrl}/lifecycle/sla-units`);
  return response.json();
}

// ─── Create / Delete step ────────────────────────────────────────────────────

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

// ─── Document grants ─────────────────────────────────────────────────────────

export async function getDocumentStepGrants(
  organizationId: string,
  documentId: string,
  stepId: string,
): Promise<LifecycleDocumentGrantsResponse> {
  const response = await httpClient.get(
    `${backendUrl}/lifecycle/documents/${documentId}/steps/${stepId}/grants`,
    { headers: { 'X-Org-Id': organizationId } },
  );
  return response.json() as Promise<LifecycleDocumentGrantsResponse>;
}

export async function grantLifecycleDocument(
  organizationId: string,
  documentId: string,
  body: GrantLifecycleDocumentRequest,
): Promise<GrantLifecycleDocumentResponse> {
  const response = await httpClient.post(
    `${backendUrl}/lifecycle/documents/${documentId}/grants`,
    body,
    { headers: { 'X-Org-Id': organizationId } },
  );
  return response.json() as Promise<GrantLifecycleDocumentResponse>;
}

export async function revokeLifecycleDocument(
  organizationId: string,
  documentId: string,
  body: RevokeLifecycleDocumentRequest,
): Promise<RevokeLifecycleDocumentResponse> {
  const response = await httpClient.post(
    `${backendUrl}/lifecycle/documents/${documentId}/grants/revoke`,
    body,
    { headers: { 'X-Org-Id': organizationId } },
  );
  return response.json() as Promise<RevokeLifecycleDocumentResponse>;
}
