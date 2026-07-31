"use client"

import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { Workflow as WorkflowIcon, Loader2, ShieldAlert } from "lucide-react"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useWorkflows, workflowQueryKeys } from "@/hooks/useWorkflows"
import { useWorkflowTemplates, useCreateTemplateExpress, workflowTemplateQueryKeys } from "@/hooks/useWorkflowTemplates"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { useHuemulFilters } from "@/hooks/useHuemulFilters"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import { HuemulFilterButton } from "@/huemul/components/huemul-filter-button"
import { HuemulFilterChips } from "@/huemul/components/huemul-filter-chips"
import { HuemulFilterPanel } from "@/huemul/components/huemul-filter-panel"
import { HuemulFilterInline } from "@/huemul/components/huemul-filter-inline"
import { HuemulCustomFieldFilter } from "@/huemul/components/huemul-custom-field-filter"
import type { FetchOptionsParams, FetchOptionsResult } from "@/huemul/components/huemul-field"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"
import { getDocumentTypes } from "@/services/document-types"
import { getUsers } from "@/services/users"
import { getAllTemplates } from "@/services/templates"
import { WorkflowTable, WorkflowDetailPanel, WorkflowTemplateCards } from "@/components/workflow"
import type { WorkflowItem } from "@/types/workflow"
import type { WorkflowTemplateItem, CreateExpressResult } from "@/types/templates"
import type { HuemulFilterDef, HuemulFilterValue, HuemulDateRangeValue } from "@/types/huemul"
import type { ExecutionLifecycleState } from "@/types/execution"

export default function WorkflowPage() {
  const { t } = useTranslation("workflow")
  const { t: tAssets } = useTranslation("assets")
  const { t: tFilters } = useTranslation("huemul-filters")
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const { canAccessAssets, isLoading: isLoadingPermissions } = useUserPermissions()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedRow, setSelectedRow] = useState<WorkflowItem | null>(null)
  const [expressTemplate, setExpressTemplate] = useState<WorkflowTemplateItem | null>(null)
  const [expressDoc, setExpressDoc] = useState<CreateExpressResult | null>(null)

  const createExpress = useCreateTemplateExpress(selectedOrganizationId ?? "")

  const fetchDocumentTypes = useCallback(
    async ({ search: s }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getDocumentTypes({ search: s || undefined })
      return {
        options: (res.data ?? []).map((dt) => ({ value: dt.id, label: dt.name })),
        hasMore: false,
      }
    },
    [],
  )

  const fetchUsers = useCallback(
    async ({ search: s, page: p, pageSize: ps }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getUsers(selectedOrganizationId ?? undefined, p, ps, s)
      return {
        options: (res.data ?? []).map((u) => ({
          value: u.id,
          label: [u.name, u.last_name].filter(Boolean).join(" "),
        })),
        hasMore: res.has_next ?? false,
      }
    },
    [selectedOrganizationId],
  )

  const fetchExpressTemplates = useCallback(
    async ({ search: s, page: p, pageSize: ps }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getAllTemplates(selectedOrganizationId ?? "", s, p, ps, {
        can_create_express: true,
        mostrar_en_workflow: true,
      })
      return {
        options: (res.data ?? []).map((tpl) => ({ value: tpl.id, label: tpl.name })),
        hasMore: res.has_next ?? false,
      }
    },
    [selectedOrganizationId],
  )

  const filterDefs = useMemo<HuemulFilterDef[]>(() => {
    const classification = tFilters("groups.classification")
    const dates = tFilters("groups.dates")
    const other = tFilters("groups.other")
    return [
      {
        key: "search",
        type: "text",
        group: tFilters("groups.search"),
        toolbar: true,
        label: t("filters.search"),
        placeholder: t("filters.searchPlaceholder"),
        inputClassName: "w-56",
      },
      {
        key: "lifecycleState",
        type: "select",
        group: classification,
        label: t("filters.lifecycleState"),
        allValue: "__all__",
        options: [
          { value: "__all__", label: t("filters.allLifecycleStates") },
          { value: "draft", label: tAssets("lifecycle.stateLabels.draft") },
          { value: "in_review", label: tAssets("lifecycle.stateLabels.in_review") },
          { value: "in_approval", label: tAssets("lifecycle.stateLabels.in_approval") },
          { value: "approved", label: tAssets("lifecycle.stateLabels.approved") },
          { value: "published", label: tAssets("lifecycle.stateLabels.published") },
          { value: "archived", label: tAssets("lifecycle.stateLabels.archived") },
        ],
      },
      {
        key: "documentTypeId",
        type: "async-combobox",
        group: classification,
        label: t("filters.documentType"),
        placeholder: t("filters.allDocumentTypes"),
        fetchOptions: fetchDocumentTypes,
        pageSize: 50,
        searchOnEnter: true,
      },
      {
        key: "templateId",
        type: "async-combobox",
        group: classification,
        label: t("filters.template"),
        placeholder: t("filters.allTemplates"),
        fetchOptions: fetchExpressTemplates,
        pageSize: 20,
        searchOnEnter: true,
      },
      {
        key: "ownerValue",
        type: "async-combobox",
        group: classification,
        label: t("filters.ownerScope"),
        placeholder: t("filters.allOwners"),
        fetchOptions: fetchUsers,
        pageSize: 20,
        searchOnEnter: true,
        staticOptions: [
          { value: "__me__", label: t("filters.ownerMe"), description: t("filters.ownerMeDescription") },
        ],
        staticOptionsLabel: t("filters.ownerScopeLabel"),
        asyncResultsLabel: t("filters.ownerUsersLabel"),
      },
      { key: "expirationDate", type: "date-range", group: dates, label: t("filters.expirationDate") },
      { key: "estimatedPublicationDate", type: "date-range", group: dates, label: t("filters.estimatedPublicationDate") },
      { key: "reviewDate", type: "date-range", group: dates, label: t("filters.reviewDate") },
      { key: "auditDate", type: "date-range", group: dates, label: t("filters.auditDate") },
      {
        key: "customFieldFilter",
        type: "custom",
        multiEntry: true,
        group: t("filters.customFieldsGroup"),
        label: t("filters.customFields"),
        render: ({ value, setValue }) => (
          <HuemulCustomFieldFilter
            value={Array.isArray(value) ? (value as string[]) : []}
            onChange={(next) => setValue(next)}
          />
        ),
      },
      { key: "hasPendingAiSuggestion", type: "boolean", group: other, label: t("filters.pendingAiSuggestion") },
      { key: "hasUnresolvedComments", type: "boolean", group: other, label: t("filters.unresolvedComments") },
      { key: "expiringSoon", type: "boolean", group: other, label: t("filters.expiringSoon") },
    ]
  }, [t, tAssets, tFilters, fetchDocumentTypes, fetchExpressTemplates, fetchUsers])

  const {
    values,
    open: filtersOpen,
    setOpen: setFiltersOpen,
    setValue,
    clearValue,
    clearAll,
    chips,
    activeCount,
    setSelectedLabel,
  } = useHuemulFilters({ filters: filterDefs, defaultOpen: false })

  const handleFilterChange = useCallback((key: string, value: HuemulFilterValue) => {
    setValue(key, value)
    setPage(1)
  }, [setValue])

  const handleChipRemove = useCallback((key: string) => {
    clearValue(key)
    setPage(1)
  }, [clearValue])

  const handleClearAll = useCallback(() => {
    clearAll()
    setPage(1)
  }, [clearAll])

  const expiration = (values.expirationDate as HuemulDateRangeValue | undefined) ?? {}
  const estimatedPublication = (values.estimatedPublicationDate as HuemulDateRangeValue | undefined) ?? {}
  const review = (values.reviewDate as HuemulDateRangeValue | undefined) ?? {}
  const audit = (values.auditDate as HuemulDateRangeValue | undefined) ?? {}

  const {
    data: workflowsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useWorkflows(selectedOrganizationId ?? "", {
    enabled: !!selectedOrganizationId && !!organizationToken && canAccessAssets,
    page,
    pageSize,
    search: (values.search as string) || undefined,
    document_type_id: (values.documentTypeId as string) || undefined,
    template_id: (values.templateId as string) || undefined,
    lifecycle_state: (values.lifecycleState && values.lifecycleState !== "__all__"
      ? values.lifecycleState
      : undefined) as ExecutionLifecycleState | undefined,
    owner_scope: values.ownerValue === "__me__" ? "me" : undefined,
    created_by: values.ownerValue && values.ownerValue !== "__me__" ? String(values.ownerValue) : undefined,
    has_pending_ai_suggestion: (values.hasPendingAiSuggestion as boolean) || undefined,
    has_unresolved_comments: (values.hasUnresolvedComments as boolean) || undefined,
    expiring_soon: (values.expiringSoon as boolean) || undefined,
    expiration_date: expiration.date || undefined,
    expiration_date_from: expiration.from || undefined,
    expiration_date_to: expiration.to || undefined,
    estimated_publication_date: estimatedPublication.date || undefined,
    estimated_publication_date_from: estimatedPublication.from || undefined,
    estimated_publication_date_to: estimatedPublication.to || undefined,
    review_date: review.date || undefined,
    review_date_from: review.from || undefined,
    review_date_to: review.to || undefined,
    audit_date: audit.date || undefined,
    audit_date_from: audit.from || undefined,
    audit_date_to: audit.to || undefined,
    custom_field_filter: (values.customFieldFilter as string[] | undefined)?.filter(Boolean).length
      ? (values.customFieldFilter as string[]).filter(Boolean)
      : undefined,
  })

  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!workflowsResponse,
  })

  const items = workflowsResponse?.data ?? []

  const { data: templateItems = [], isLoading: isLoadingTemplates } = useWorkflowTemplates(
    selectedOrganizationId ?? "",
    { enabled: !!selectedOrganizationId && !!organizationToken && canAccessAssets },
  )

  if (isLoadingPermissions) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!canAccessAssets) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <ShieldAlert className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("common:accessDenied", { defaultValue: "You don't have access to this page" })}</p>
      </div>
    )
  }

  if (showPageLoader) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <HuemulPageLayout
        header={
          <PageHeader
            icon={WorkflowIcon}
            title={t("header.title")}
            showRefresh
            onRefresh={() => {
              queryClient.invalidateQueries({ queryKey: workflowQueryKeys.listBase() })
              queryClient.invalidateQueries({ queryKey: workflowTemplateQueryKeys.listBase() })
            }}
            isLoading={isFetching}
            hasError={!!error}
          />
        }
        headerClassName="p-2 sm:p-4 md:p-4 lg:p-6 pb-0 sm:pb-0 md:pb-0 lg:pb-0"
        columns={[
          {
            content: (
              <HuemulFilterPanel
                filters={filterDefs}
                values={values}
                onChange={handleFilterChange}
                onSelectedLabel={setSelectedLabel}
                onClose={() => setFiltersOpen(false)}
              />
            ),
            show: filtersOpen,
            defaultSize: 22,
            minSize: 16,
            maxSize: 35,
            collapsible: true,
          },
          {
            content: (
              <div className="flex flex-col h-full overflow-hidden p-2 sm:p-4 md:p-4 lg:p-6 pt-0 sm:pt-0 md:pt-0 lg:pt-0 gap-4">
                <div className="shrink-0 flex items-center gap-2">
                  <HuemulFilterButton
                    count={activeCount}
                    open={filtersOpen}
                    onToggle={() => setFiltersOpen(!filtersOpen)}
                  />
                  <HuemulFilterInline
                    filters={filterDefs}
                    values={values}
                    onChange={handleFilterChange}
                    onSelectedLabel={setSelectedLabel}
                  />
                </div>
                <HuemulFilterChips
                  chips={chips}
                  onRemove={handleChipRemove}
                  onClearAll={handleClearAll}
                />
                <div className="shrink-0 min-w-0">
                  <WorkflowTemplateCards
                    items={templateItems}
                    isLoading={isLoadingTemplates}
                    onStart={(item) => {
                      setSelectedRow(null)
                      setExpressDoc(null)
                      setExpressTemplate(item)
                      if (!item.require_name_on_express) {
                        createExpress
                          .mutateAsync({
                            documentTypeId: item.document_type_id,
                            templateId: item.id,
                            body: { name: "" },
                          })
                          .then(setExpressDoc)
                          .catch(() => {})
                      }
                    }}
                  />
                </div>
                <div className="flex-1 min-h-0">
                  <WorkflowTable
                    data={items}
                    isLoading={isTableLoading}
                    isFetching={isTableFetching}
                    error={error as Error | null}
                    onRetry={refetch}
                    selectedExecutionId={selectedRow?.execution_id ?? null}
                    onSelectRow={(item) => {
                      setExpressTemplate(null)
                      setExpressDoc(null)
                      setSelectedRow(item)
                    }}
                    pagination={{
                      page: workflowsResponse?.page || page,
                      pageSize: workflowsResponse?.page_size || pageSize,
                      hasNext: workflowsResponse?.has_next,
                      hasPrevious: (workflowsResponse?.page || page) > 1,
                      onPageChange: (newPage) => setPage(newPage),
                      onPageSizeChange: (newPageSize) => {
                        setPageSize(newPageSize)
                        setPage(1)
                      },
                      pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
                    }}
                  />
                </div>
              </div>
            ),
          },
          {
            content: selectedRow || expressTemplate ? (
              <WorkflowDetailPanel
                row={selectedRow}
                template={expressTemplate}
                createdDoc={expressDoc}
                isCreating={createExpress.isPending}
                onSubmitName={(name, description) => {
                  if (!expressTemplate) return
                  createExpress
                    .mutateAsync({
                      documentTypeId: expressTemplate.document_type_id,
                      templateId: expressTemplate.id,
                      body: { name, description },
                    })
                    .then(setExpressDoc)
                    .catch(() => {})
                }}
                onClose={() => {
                  setSelectedRow(null)
                  setExpressTemplate(null)
                  setExpressDoc(null)
                }}
              />
            ) : null,
            defaultSize: 40,
            minSize: 25,
            show: selectedRow != null || expressTemplate != null,
          },
        ]}
      />
    </>
  )
}
