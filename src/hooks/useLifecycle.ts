import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getLifecycleStepTypes,
  getLifecycleSteps,
  updateLifecycleStep,
  addRoleToStep,
  removeRoleFromStep,
  getSlaUnits,
  createLifecycleStep,
  deleteLifecycleStep,
  getDocumentStepGrants,
  grantLifecycleDocument,
  revokeLifecycleDocument,
  getExternalPublishActions,
  createExternalPublishAction,
  updateExternalPublishAction,
  deleteExternalPublishAction,
  reorderExternalPublishActions,
  type UpdateLifecycleStepData,
  type CreateLifecycleStepData,
  type GrantLifecycleDocumentRequest,
  type GrantLifecycleDocumentResponse,
  type RevokeLifecycleDocumentRequest,
  type RevokeLifecycleDocumentResponse,
  type CreateExternalPublishActionRequest,
  type UpdateExternalPublishActionRequest,
  type ReorderExternalPublishActionsRequest,
} from '@/services/lifecycle'

export const lifecycleQueryKeys = {
  all: ['lifecycle'] as const,
  stepTypes: () => [...lifecycleQueryKeys.all, 'step-types'] as const,
  steps: (documentTypeId: string, stepType: string | null) =>
    [...lifecycleQueryKeys.all, 'steps', documentTypeId, stepType] as const,
  slaUnits: () => [...lifecycleQueryKeys.all, 'sla-units'] as const,
  documentStepGrants: (organizationId: string, documentId: string, stepId: string) =>
    [...lifecycleQueryKeys.all, 'document-step-grants', organizationId, documentId, stepId] as const,
  externalPublishActionsBase: () => [...lifecycleQueryKeys.all, 'external-publish-actions'] as const,
  externalPublishActions: (stepId: string) =>
    [...lifecycleQueryKeys.externalPublishActionsBase(), stepId] as const,
}

export function useLifecycleStepTypes(enabled: boolean = true) {
  return useQuery({
    queryKey: lifecycleQueryKeys.stepTypes(),
    queryFn: getLifecycleStepTypes,
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 0,
  })
}

export function useLifecycleSteps(
  documentTypeId: string | null,
  stepType: string | null,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: lifecycleQueryKeys.steps(documentTypeId ?? '', stepType),
    queryFn: () => getLifecycleSteps(documentTypeId!, stepType ?? undefined),
    enabled: enabled && !!documentTypeId && !!stepType,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 0,
  })
}

export function useLifecycleSlaUnits(enabled: boolean = true) {
  return useQuery({
    queryKey: lifecycleQueryKeys.slaUnits(),
    queryFn: getSlaUnits,
    enabled,
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 0,
  })
}

export function useLifecycleMutations(documentTypeId: string, stepType: string | null) {
  const queryClient = useQueryClient()

  const invalidateSteps = () => {
    queryClient.invalidateQueries({
      queryKey: lifecycleQueryKeys.steps(documentTypeId, stepType),
    })
  }

  const updateStep = useMutation({
    mutationFn: ({ stepId, data }: { stepId: string; data: UpdateLifecycleStepData }) =>
      updateLifecycleStep(stepId, data),
    onSuccess: invalidateSteps,
  })

  const addRole = useMutation({
    mutationFn: ({ stepId, roleId }: { stepId: string; roleId: string }) =>
      addRoleToStep(stepId, roleId),
    onSuccess: invalidateSteps,
  })

  const removeRole = useMutation({
    mutationFn: ({ stepId, roleId }: { stepId: string; roleId: string }) =>
      removeRoleFromStep(stepId, roleId),
    onSuccess: invalidateSteps,
  })

  const createStep = useMutation({
    mutationFn: (data: CreateLifecycleStepData) =>
      createLifecycleStep(documentTypeId, data),
    onSuccess: invalidateSteps,
  })

  const deleteStep = useMutation({
    mutationFn: (stepId: string) => deleteLifecycleStep(stepId),
    onSuccess: invalidateSteps,
  })

  return { updateStep, addRole, removeRole, createStep, deleteStep }
}

// ─── Document grants ────────────────────────────────────────────────────────

export function useDocumentStepGrants(
  organizationId: string,
  documentId: string,
  stepId: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: lifecycleQueryKeys.documentStepGrants(organizationId, documentId, stepId),
    queryFn: () => getDocumentStepGrants(organizationId, documentId, stepId),
    enabled: enabled && !!organizationId && !!documentId && !!stepId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}

export function useDocumentGrantMutations(organizationId: string, documentId: string) {
  const queryClient = useQueryClient()

  const grant = useMutation({
    mutationFn: (body: GrantLifecycleDocumentRequest) =>
      grantLifecycleDocument(organizationId, documentId, body),
    onSuccess: (_data: GrantLifecycleDocumentResponse, { lifecycle_step_id }) => {
      queryClient.invalidateQueries({
        queryKey: lifecycleQueryKeys.documentStepGrants(organizationId, documentId, lifecycle_step_id),
      })
    },
  })

  const revoke = useMutation({
    mutationFn: (body: RevokeLifecycleDocumentRequest) =>
      revokeLifecycleDocument(organizationId, documentId, body),
    onSuccess: (_data: RevokeLifecycleDocumentResponse, { lifecycle_step_id }) => {
      queryClient.invalidateQueries({
        queryKey: lifecycleQueryKeys.documentStepGrants(organizationId, documentId, lifecycle_step_id),
      })
    },
  })

  return { grant, revoke }
}

// ─── External Publish Actions ─────────────────────────────────────────────────

export function useExternalPublishActions(
  organizationId: string,
  stepId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: lifecycleQueryKeys.externalPublishActions(stepId),
    queryFn: () => getExternalPublishActions(stepId, organizationId),
    enabled: enabled && !!organizationId && !!stepId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}

export function useExternalPublishActionMutations(organizationId: string, stepId: string) {
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: lifecycleQueryKeys.externalPublishActions(stepId),
    })

  const createAction = useMutation({
    mutationFn: (body: CreateExternalPublishActionRequest) =>
      createExternalPublishAction(stepId, organizationId, body),
    onSuccess: invalidate,
  })

  const updateAction = useMutation({
    mutationFn: ({ actionId, body }: { actionId: string; body: UpdateExternalPublishActionRequest }) =>
      updateExternalPublishAction(stepId, actionId, organizationId, body),
    onSuccess: invalidate,
  })

  const deleteAction = useMutation({
    mutationFn: (actionId: string) => deleteExternalPublishAction(stepId, actionId, organizationId),
    onSuccess: invalidate,
  })

  const reorderActions = useMutation({
    mutationFn: (body: ReorderExternalPublishActionsRequest) =>
      reorderExternalPublishActions(stepId, organizationId, body),
    onSuccess: invalidate,
  })

  return { createAction, updateAction, deleteAction, reorderActions }
}
