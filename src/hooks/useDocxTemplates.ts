import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  uploadDocxTemplate,
  uploadDocxTemplateForTemplate,
  getDocxTemplatesForTemplate,
  replaceDocxTemplateFile,
  renameDocxTemplate,
  deleteDocxTemplate,
  getAvailableDocxTemplatesForDocument,
} from '@/services/docx_template'
import { getAvailableDocxTemplatesForExecution } from '@/services/executions'
import type {
  RenameDocxTemplateRequest,
} from '@/types/docx-templates'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const docxTemplateQueryKeys = {
  all: ['docx-templates'] as const,
  listBase: () => [...docxTemplateQueryKeys.all, 'list'] as const,
  list: (organizationId: string, templateId: string, page: number, pageSize: number) =>
    [...docxTemplateQueryKeys.listBase(), organizationId, templateId, page, pageSize] as const,
  availableForDocument: (organizationId: string, documentId: string) =>
    [...docxTemplateQueryKeys.all, 'available', 'document', organizationId, documentId] as const,
  availableForExecution: (organizationId: string, executionId: string) =>
    [...docxTemplateQueryKeys.all, 'available', 'execution', organizationId, executionId] as const,
}

// ─── List query (templates of a Template resource) ────────────────────────────

export interface UseDocxTemplatesForTemplateOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
}

export function useDocxTemplatesForTemplate(
  organizationId: string,
  templateId: string,
  options: UseDocxTemplatesForTemplateOptions = {},
) {
  const { enabled = true, page = 1, pageSize = 100 } = options

  return useQuery({
    queryKey: docxTemplateQueryKeys.list(organizationId, templateId, page, pageSize),
    queryFn: () =>
      getDocxTemplatesForTemplate(templateId, organizationId, { page, page_size: pageSize }),
    enabled: enabled && !!organizationId && !!templateId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

// ─── Available templates for a document ──────────────────────────────────────

export function useAvailableDocxTemplatesForDocument(
  organizationId: string,
  documentId: string,
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options

  return useQuery({
    queryKey: docxTemplateQueryKeys.availableForDocument(organizationId, documentId),
    queryFn: () => getAvailableDocxTemplatesForDocument(documentId, organizationId),
    enabled: enabled && !!organizationId && !!documentId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}

// ─── Available templates for an execution ────────────────────────────────────

export function useAvailableDocxTemplatesForExecution(
  organizationId: string,
  executionId: string,
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options

  return useQuery({
    queryKey: docxTemplateQueryKeys.availableForExecution(organizationId, executionId),
    queryFn: () => getAvailableDocxTemplatesForExecution(executionId, organizationId),
    enabled: enabled && !!organizationId && !!executionId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}

// ─── Mutations for document DOCX template ────────────────────────────────────

export function useDocxTemplateMutationsForDocument(
  organizationId: string,
  documentId: string,
) {
  const queryClient = useQueryClient()

  const invalidateAvailable = () =>
    queryClient.invalidateQueries({
      queryKey: docxTemplateQueryKeys.availableForDocument(organizationId, documentId),
    })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadDocxTemplate(documentId, file, organizationId),
    onSuccess: invalidateAvailable,
  })

  return { uploadDocxTemplate: uploadMutation }
}

// ─── Mutations for template DOCX templates ───────────────────────────────────

export function useDocxTemplateMutationsForTemplate(
  organizationId: string,
  templateId: string,
) {
  const queryClient = useQueryClient()

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: docxTemplateQueryKeys.listBase() })

  const uploadMutation = useMutation({
    mutationFn: ({ file, name }: { file: File; name?: string }) =>
      uploadDocxTemplateForTemplate(templateId, file, organizationId, name),
    onSuccess: invalidateList,
  })

  const replaceMutation = useMutation({
    mutationFn: ({
      docxTemplateId,
      file,
      name,
    }: {
      docxTemplateId: string
      file: File
      name?: string
    }) => replaceDocxTemplateFile(templateId, docxTemplateId, file, organizationId, name),
    onSuccess: invalidateList,
  })

  const renameMutation = useMutation({
    mutationFn: ({
      docxTemplateId,
      body,
    }: {
      docxTemplateId: string
      body: RenameDocxTemplateRequest
    }) => renameDocxTemplate(templateId, docxTemplateId, body, organizationId),
    onSuccess: invalidateList,
  })

  const deleteMutation = useMutation({
    mutationFn: (docxTemplateId: string) =>
      deleteDocxTemplate(templateId, docxTemplateId, organizationId),
    onSuccess: invalidateList,
  })

  return {
    uploadDocxTemplate: uploadMutation,
    replaceDocxTemplate: replaceMutation,
    renameDocxTemplate: renameMutation,
    deleteDocxTemplate: deleteMutation,
  }
}
