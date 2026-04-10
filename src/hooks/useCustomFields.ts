import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getCustomFields,
  getCustomField,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  getCustomFieldDataTypes,
} from "@/services/custom-fields"
import type {
  UpdateCustomFieldRequest,
  PaginationParams,
} from "@/types/custom-fields"

// Query keys
export const customFieldsQueryKeys = {
  all: ['custom-fields'] as const,
  lists: () => [...customFieldsQueryKeys.all, 'list'] as const,
  list: (params?: PaginationParams) => [...customFieldsQueryKeys.lists(), params] as const,
  details: () => [...customFieldsQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...customFieldsQueryKeys.details(), id] as const,
  dataTypes: () => [...customFieldsQueryKeys.all, 'data-types'] as const,
}

// Hook for fetching custom fields list
export function useCustomFields(options?: PaginationParams & { enabled?: boolean }) {
  const { enabled = true, search, ...params } = options || {}
  const queryParams = { ...params, ...(search ? { search } : {}) }
  return useQuery({
    queryKey: customFieldsQueryKeys.list(queryParams),
    queryFn: () => getCustomFields(queryParams),
    placeholderData: (prev) => prev,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for fetching single custom field
export function useCustomField(id: string, enabled = true) {
  return useQuery({
    queryKey: customFieldsQueryKeys.detail(id),
    queryFn: () => getCustomField(id),
    enabled,
  })
}

// Hook for fetching custom field data types
export function useCustomFieldDataTypes(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: customFieldsQueryKeys.dataTypes(),
    queryFn: getCustomFieldDataTypes,
    enabled: options?.enabled !== false,
    staleTime: 30 * 60 * 1000, // 30 minutes - data types don't change often
  })
}

// Custom fields mutations hook
export function useCustomFieldMutations() {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createCustomField,
    meta: { successMessage: 'Custom field created successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldsQueryKeys.lists() })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomFieldRequest }) =>
      updateCustomField(id, data),
    meta: { successMessage: 'Custom field updated successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldsQueryKeys.all })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCustomField,
    meta: { successMessage: 'Custom field deleted successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldsQueryKeys.lists() })
    },
  })

  return {
    create: createMutation,
    update: updateMutation,
    delete: deleteMutation,
  }
}