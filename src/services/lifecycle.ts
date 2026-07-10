import { httpClient } from '@/lib/http-client';
import { backendUrl } from '@/config';
import type { LifecycleStepType, LifecycleStepTypesResponse, LifecycleStepRole, LifecycleStep, LifecycleStepsResponse, UpdateLifecycleStepData, SlaUnit, SlaUnitsResponse, CreateLifecycleStepData, LifecycleStepResponse, LifecycleDocumentGrant, LifecycleDocumentGrantsResponse, GrantLifecycleDocumentRequest, GrantLifecycleDocumentResponse, RevokeLifecycleDocumentRequest, RevokeLifecycleDocumentResponse, ExternalPublishAction, ExternalPublishActionsResponse, ExternalPublishActionResponse, CreateExternalPublishActionRequest, UpdateExternalPublishActionRequest, ReorderExternalPublishActionsRequest, ExternalReviewAction, ExternalReviewActionsResponse, ExternalReviewActionResponse, CreateExternalReviewActionRequest, UpdateExternalReviewActionRequest, ReorderExternalReviewActionsRequest } from '@/types/lifecycle';

export type { LifecycleStepType, LifecycleStepTypesResponse, LifecycleStepRole, LifecycleStep, LifecycleStepsResponse, UpdateLifecycleStepData, SlaUnit, SlaUnitsResponse, CreateLifecycleStepData, LifecycleStepResponse, LifecycleDocumentGrant, LifecycleDocumentGrantsResponse, GrantLifecycleDocumentRequest, GrantLifecycleDocumentResponse, RevokeLifecycleDocumentRequest, RevokeLifecycleDocumentResponse, ExternalPublishAction, ExternalPublishActionsResponse, ExternalPublishActionResponse, CreateExternalPublishActionRequest, UpdateExternalPublishActionRequest, ReorderExternalPublishActionsRequest, ExternalReviewAction, ExternalReviewActionsResponse, ExternalReviewActionResponse, CreateExternalReviewActionRequest, UpdateExternalReviewActionRequest, ReorderExternalReviewActionsRequest };

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

// ─── External Publish Actions ─────────────────────────────────────────────────

export async function getExternalPublishActions(
  stepId: string,
  organizationId: string,
): Promise<ExternalPublishActionsResponse> {
  const response = await httpClient.get(
    `${backendUrl}/lifecycle/steps/${stepId}/external-publish-actions/`,
    { headers: { 'X-Org-Id': organizationId } },
  )
  return response.json() as Promise<ExternalPublishActionsResponse>
}

export async function createExternalPublishAction(
  stepId: string,
  organizationId: string,
  body: CreateExternalPublishActionRequest,
): Promise<ExternalPublishAction> {
  const response = await httpClient.post(
    `${backendUrl}/lifecycle/steps/${stepId}/external-publish-actions/`,
    body,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as ExternalPublishActionResponse
  return data.data
}

export async function updateExternalPublishAction(
  stepId: string,
  actionId: string,
  organizationId: string,
  body: UpdateExternalPublishActionRequest,
): Promise<ExternalPublishAction> {
  const response = await httpClient.put(
    `${backendUrl}/lifecycle/steps/${stepId}/external-publish-actions/${actionId}`,
    body,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as ExternalPublishActionResponse
  return data.data
}

export async function deleteExternalPublishAction(
  stepId: string,
  actionId: string,
  organizationId: string,
): Promise<void> {
  await httpClient.delete(
    `${backendUrl}/lifecycle/steps/${stepId}/external-publish-actions/${actionId}`,
    { headers: { 'X-Org-Id': organizationId } },
  )
}

export async function reorderExternalPublishActions(
  stepId: string,
  organizationId: string,
  body: ReorderExternalPublishActionsRequest,
): Promise<void> {
  await httpClient.put(
    `${backendUrl}/lifecycle/steps/${stepId}/external-publish-actions/reorder`,
    body,
    { headers: { 'X-Org-Id': organizationId } },
  )
}

// ─── External Review Actions ─────────────────────────────────────────────────

export async function getExternalReviewActions(
  stepId: string,
  organizationId: string,
): Promise<ExternalReviewActionsResponse> {
  const response = await httpClient.get(
    `${backendUrl}/lifecycle/steps/${stepId}/external-review-actions/`,
    { headers: { 'X-Org-Id': organizationId } },
  )
  return response.json() as Promise<ExternalReviewActionsResponse>
}

export async function createExternalReviewAction(
  stepId: string,
  organizationId: string,
  body: CreateExternalReviewActionRequest,
): Promise<ExternalReviewAction> {
  const response = await httpClient.post(
    `${backendUrl}/lifecycle/steps/${stepId}/external-review-actions/`,
    body,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as ExternalReviewActionResponse
  return data.data
}

export async function updateExternalReviewAction(
  stepId: string,
  actionId: string,
  organizationId: string,
  body: UpdateExternalReviewActionRequest,
): Promise<ExternalReviewAction> {
  const response = await httpClient.put(
    `${backendUrl}/lifecycle/steps/${stepId}/external-review-actions/${actionId}`,
    body,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as ExternalReviewActionResponse
  return data.data
}

export async function deleteExternalReviewAction(
  stepId: string,
  actionId: string,
  organizationId: string,
): Promise<void> {
  await httpClient.delete(
    `${backendUrl}/lifecycle/steps/${stepId}/external-review-actions/${actionId}`,
    { headers: { 'X-Org-Id': organizationId } },
  )
}

export async function reorderExternalReviewActions(
  stepId: string,
  organizationId: string,
  body: ReorderExternalReviewActionsRequest,
): Promise<void> {
  await httpClient.put(
    `${backendUrl}/lifecycle/steps/${stepId}/external-review-actions/reorder`,
    body,
    { headers: { 'X-Org-Id': organizationId } },
  )
}
