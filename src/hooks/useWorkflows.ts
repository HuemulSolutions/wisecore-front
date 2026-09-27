import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getWorkflows } from "@/services/workflow"
import { deleteDocument } from "@/services/assets"
import type { UseWorkflowsOptions } from "@/types/workflow"
export type { UseWorkflowsOptions }

// ─── Query keys ───────────────────────────────────────────────────────────────

export const workflowQueryKeys = {
  all: ["workflows"] as const,
  listBase: () => [...workflowQueryKeys.all, "list"] as const,
  list: (organizationId: string, params: Omit<UseWorkflowsOptions, "enabled">) =>
    [...workflowQueryKeys.listBase(), organizationId, params] as const,
}

// ─── List query ───────────────────────────────────────────────────────────────

export function useWorkflows(organizationId: string, options: UseWorkflowsOptions = {}) {
  const {
    enabled = true,
    page = 1,
    pageSize = 100,
    search,
    document_type_id,
    created_by,
    owner_scope,
    lifecycle_state,
    has_pending_ai_suggestion,
    has_unresolved_comments,
    expiring_soon,
    template_id,
    custom_field_filter,
    expiration_date,
    expiration_date_from,
    expiration_date_to,
    estimated_publication_date,
    estimated_publication_date_from,
    estimated_publication_date_to,
    review_date,
    review_date_from,
    review_date_to,
    audit_date,
    audit_date_from,
    audit_date_to,
  } = options

  const params = {
    page,
    pageSize,
    search,
    document_type_id,
    created_by,
    owner_scope,
    lifecycle_state,
    has_pending_ai_suggestion,
    has_unresolved_comments,
    expiring_soon,
    template_id,
    custom_field_filter,
    expiration_date,
    expiration_date_from,
    expiration_date_to,
    estimated_publication_date,
    estimated_publication_date_from,
    estimated_publication_date_to,
    review_date,
    review_date_from,
    review_date_to,
    audit_date,
    audit_date_from,
    audit_date_to,
  }

  return useQuery({
    queryKey: workflowQueryKeys.list(organizationId, params),
    queryFn: () =>
      getWorkflows(organizationId, {
        page,
        page_size: pageSize,
        search,
        document_type_id,
        created_by,
        owner_scope,
        lifecycle_state,
        has_pending_ai_suggestion,
        has_unresolved_comments,
        expiring_soon,
        template_id,
        custom_field_filter,
        expiration_date,
        expiration_date_from,
        expiration_date_to,
        estimated_publication_date,
        estimated_publication_date_from,
        estimated_publication_date_to,
        review_date,
        review_date_from,
        review_date_to,
        audit_date,
        audit_date_from,
        audit_date_to,
      }),
    enabled: enabled && !!organizationId,
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useWorkflowMutations(organizationId: string) {
  const { t } = useTranslation("workflow")
  const queryClient = useQueryClient()

  const deleteWorkflow = useMutation({
    mutationFn: (documentId: string) => deleteDocument(documentId, organizationId),
    meta: { successMessage: t("deleteDialog.success") },
    onSuccess: (_data, documentId) => {
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.listBase() })
      queryClient.removeQueries({ queryKey: ["document-content", documentId] })
    },
  })

  return { deleteWorkflow }
}
