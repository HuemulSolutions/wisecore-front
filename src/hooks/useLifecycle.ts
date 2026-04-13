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
  type UpdateLifecycleStepData,
  type CreateLifecycleStepData,
} from '@/services/lifecycle'

export const lifecycleQueryKeys = {
  all: ['lifecycle'] as const,
  stepTypes: () => [...lifecycleQueryKeys.all, 'step-types'] as const,
  steps: (documentTypeId: string, stepType: string | null) =>
    [...lifecycleQueryKeys.all, 'steps', documentTypeId, stepType] as const,
  slaUnits: () => [...lifecycleQueryKeys.all, 'sla-units'] as const,
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
