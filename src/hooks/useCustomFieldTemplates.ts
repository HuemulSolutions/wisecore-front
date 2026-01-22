import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getCustomFieldTemplateSources,
  getCustomFieldTemplatesByTemplate,
  getCustomFieldTemplate,
  createCustomFieldTemplate,
  updateCustomFieldTemplate,
  deleteCustomFieldTemplate,
  uploadCustomFieldTemplateValueBlob,
} from "@/services/custom-fields-templates"
import type { UpdateCustomFieldTemplateRequest } from "@/types/custom-fields-templates"
import { useOrganization } from "@/contexts/organization-context"

// Query keys
export const customFieldTemplatesQueryKeys = {
  all: ['custom-field-templates'] as const,
  sources: () => [...customFieldTemplatesQueryKeys.all, 'sources'] as const,
  byTemplate: (templateId: string) => [...customFieldTemplatesQueryKeys.all, 'by-template', templateId] as const,
  detail: (id: string) => [...customFieldTemplatesQueryKeys.all, 'detail', id] as const,
}

// Hook for fetching custom field template sources
export function useCustomFieldTemplateSources() {
  return useQuery({
    queryKey: customFieldTemplatesQueryKeys.sources(),
    queryFn: getCustomFieldTemplateSources,
    staleTime: 30 * 60 * 1000, // 30 minutes - sources don't change often
    select: (data) => data.data, // Extract the data array from the API response
  })
}

// Hook for fetching custom field templates by template ID
export function useCustomFieldTemplatesByTemplate(
  templateId: string, 
  options?: { 
    enabled?: boolean
    page?: number
    page_size?: number
  }
) {
  const page = options?.page ?? 1
  const page_size = options?.page_size ?? 1000
  
  return useQuery({
    queryKey: [...customFieldTemplatesQueryKeys.byTemplate(templateId), page, page_size],
    queryFn: () => getCustomFieldTemplatesByTemplate({ 
      template_id: templateId,
      page,
      page_size
    }),
    enabled: options?.enabled !== false && !!templateId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for fetching single custom field template
export function useCustomFieldTemplate(id: string, enabled = true) {
  return useQuery({
    queryKey: customFieldTemplatesQueryKeys.detail(id),
    queryFn: () => getCustomFieldTemplate(id),
    enabled: enabled && !!id,
    // No select needed here as the service returns CustomFieldTemplate directly
  })
}

// Custom field templates mutations hook
export function useCustomFieldTemplateMutations() {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createCustomFieldTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldTemplatesQueryKeys.all })
      toast.success('Custom field template created successfully')
    },
    onError: (error) => {
      toast.error(`Failed to create custom field template: ${error.message}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomFieldTemplateRequest }) =>
      updateCustomFieldTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldTemplatesQueryKeys.all })
      toast.success('Custom field template updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update custom field template: ${error.message}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCustomFieldTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldTemplatesQueryKeys.all })
      toast.success('Custom field template deleted successfully')
    },
    onError: (error) => {
      toast.error(`Failed to delete custom field template: ${error.message}`)
    },
  })

  const { selectedOrganizationId } = useOrganization();

  const uploadValueBlobMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      uploadCustomFieldTemplateValueBlob(id, file, selectedOrganizationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldTemplatesQueryKeys.all })
      toast.success('Image uploaded successfully')
    },
    onError: (error) => {
      toast.error(`Failed to upload image: ${error.message}`)
    },
  })

  return {
    create: createMutation,
    update: updateMutation,
    delete: deleteMutation,
    uploadValueBlob: uploadValueBlobMutation,
  }
}