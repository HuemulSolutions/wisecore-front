"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { RefreshCw, Loader2, Trash2 } from "lucide-react"
import { useOrganization } from "@/contexts/organization-context"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useWorkflows, useWorkflowMutations, workflowQueryKeys } from "@/hooks/useWorkflows"
import { useWorkflowTemplates, useCreateTemplateExpress, workflowTemplateQueryKeys } from "@/hooks/useWorkflowTemplates"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { useHuemulFilters } from "@/hooks/useHuemulFilters"
import { useGridColumns } from "@/hooks/useGridColumns"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { HuemulAccessDenied } from "@/huemul/components/huemul-access-denied"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { HuemulButton } from "@/huemul/components/huemul-button"
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
  const { t: tCommon } = useTranslation("common")
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const { canAccessPage, can, isLoading: isLoadingPermissions } = usePageAccess("workflow")
  const queryClient = useQueryClient()

  // Crear un express es la única razón por la que existen las tarjetas de
  // templates: sin `asset:c` no se listan ni se pega a GET /templates/.
  const canCreateExpress = can("createExpressAsset") && can("listTemplates")
  const canDelete = can("deleteAsset")

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedRow, setSelectedRow] = useState<WorkflowItem | null>(null)
  const [expressTemplate, setExpressTemplate] = useState<WorkflowTemplateItem | null>(null)
  const [expressDoc, setExpressDoc] = useState<CreateExpressResult | null>(null)
  const [deletingRow, setDeletingRow] = useState<WorkflowItem | null>(null)

  const createExpress = useCreateTemplateExpress(selectedOrganizationId ?? "")
  const { deleteWorkflow } = useWorkflowMutations(selectedOrganizationId ?? "")

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

  // Los filtros son superficie RBAC: cada combobox asíncrono pega a un endpoint
  // de OTRO recurso y sin permiso se come un 403 mudo al abrirse. Se omite la
  // entrada de `filterDefs` (elimina también su chip sin tocar useHuemulFilters).
  const canFilterByAssetType = can("listAssetTypes")
  const canFilterByTemplate = can("listTemplates")
  const canFilterByUser = can("listUsers")
  const canFilterByCustomField = can("listCustomFields")

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
        inputClassName: "w-full min-w-0",
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
      // Sin el permiso del recurso que consulta, se omite la entrada entera
      // (elimina también su chip sin tocar useHuemulFilters, patrón /diagrams).
      ...(canFilterByAssetType
        ? [
            {
              key: "documentTypeId",
              type: "async-combobox" as const,
              group: classification,
              label: t("filters.documentType"),
              placeholder: t("filters.allDocumentTypes"),
              fetchOptions: fetchDocumentTypes,
              pageSize: 50,
              searchOnEnter: true,
            },
          ]
        : []),
      ...(canFilterByTemplate
        ? [
            {
              key: "templateId",
              type: "async-combobox" as const,
              group: classification,
              label: t("filters.template"),
              placeholder: t("filters.allTemplates"),
              fetchOptions: fetchExpressTemplates,
              pageSize: 20,
              searchOnEnter: true,
            },
          ]
        : []),
      // Sin `user:l|r` se DEGRADA a un select estático en vez de omitirse: la
      // opción __me__ manda owner_scope=me y no lista usuarios, y omitir la
      // entrada dejaría ese valor huérfano fuera de chips/clearAll (patrón /home).
      canFilterByUser
        ? ({
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
          } as HuemulFilterDef)
        : ({
            key: "ownerValue",
            type: "select",
            group: classification,
            label: t("filters.ownerScope"),
            allValue: "",
            options: [
              { value: "", label: t("filters.allOwners") },
              { value: "__me__", label: t("filters.ownerMe") },
            ],
          } as HuemulFilterDef),
      { key: "expirationDate", type: "date-range", group: dates, label: t("filters.expirationDate") },
      { key: "estimatedPublicationDate", type: "date-range", group: dates, label: t("filters.estimatedPublicationDate") },
      { key: "reviewDate", type: "date-range", group: dates, label: t("filters.reviewDate") },
      { key: "auditDate", type: "date-range", group: dates, label: t("filters.auditDate") },
      ...(canFilterByCustomField
        ? [
            {
              key: "customFieldFilter",
              type: "custom" as const,
              multiEntry: true,
              group: t("filters.customFieldsGroup"),
              label: t("filters.customFields"),
              render: ({ value, setValue }: { value: HuemulFilterValue; setValue: (v: HuemulFilterValue) => void }) => (
                <HuemulCustomFieldFilter
                  value={Array.isArray(value) ? (value as string[]) : []}
                  onChange={(next) => setValue(next)}
                />
              ),
            },
          ]
        : []),
      { key: "hasPendingAiSuggestion", type: "boolean", group: other, label: t("filters.pendingAiSuggestion") },
      { key: "hasUnresolvedComments", type: "boolean", group: other, label: t("filters.unresolvedComments") },
      { key: "expiringSoon", type: "boolean", group: other, label: t("filters.expiringSoon") },
    ]
  }, [
    t,
    tAssets,
    tFilters,
    fetchDocumentTypes,
    fetchExpressTemplates,
    fetchUsers,
    canFilterByAssetType,
    canFilterByTemplate,
    canFilterByUser,
    canFilterByCustomField,
  ])

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
    enabled: !!selectedOrganizationId && !!organizationToken && can("listWorkflows"),
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

  const templateColumns = useGridColumns()
  const templatesPageSize = templateColumns * 2
  const [templatesPage, setTemplatesPage] = useState(1)

  useEffect(() => {
    setTemplatesPage(1)
  }, [templatesPageSize])

  const { data: templatesResponse, isLoading: isLoadingTemplates } = useWorkflowTemplates(
    selectedOrganizationId ?? "",
    {
      enabled: !!selectedOrganizationId && !!organizationToken && canCreateExpress,
    },
  )
  const allTemplateItems = templatesResponse?.items ?? []
  const templateItems = allTemplateItems.slice(
    (templatesPage - 1) * templatesPageSize,
    templatesPage * templatesPageSize,
  )
  const templatesHasNext = templatesPage * templatesPageSize < allTemplateItems.length

  if (isLoadingPermissions) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!canAccessPage) {
    return <HuemulAccessDenied variant="inline" />
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
            // Header propio de la columna: el mockup requiere que los paneles
            // laterales lleguen al tope, por eso no se usa el header full-width
            // del layout (ver HuemulPageLayout `header` prop).
            header: {
              content: (
                <div className="flex items-center gap-2 border-b bg-background px-2 py-1.5 sm:px-4 md:px-4 lg:px-6">
                  <h1 className="min-w-0 truncate text-sm font-semibold text-foreground">
                    {t("header.title")}
                  </h1>
                  <HuemulFilterButton
                    count={activeCount}
                    open={filtersOpen}
                    onToggle={() => setFiltersOpen(!filtersOpen)}
                    className="h-8 shrink-0 px-2 text-xs"
                  />
                  <HuemulFilterInline
                    filters={filterDefs}
                    values={values}
                    onChange={handleFilterChange}
                    onSelectedLabel={setSelectedLabel}
                    className="min-w-0 flex-1"
                  />
                  <HuemulButton
                    variant="outline"
                    size="sm"
                    icon={RefreshCw}
                    iconClassName="w-3 h-3 mr-1 text-muted-foreground"
                    label={tCommon("refresh")}
                    loading={isFetching}
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.listBase() })
                      queryClient.invalidateQueries({ queryKey: workflowTemplateQueryKeys.listBase() })
                    }}
                    className="ml-auto h-8 shrink-0 px-2 text-xs"
                  />
                </div>
              ),
            },
            content: (
              <div className="flex flex-col h-full overflow-hidden p-2 sm:p-4 md:p-4 lg:p-6 gap-4">
                <HuemulFilterChips
                  chips={chips}
                  onRemove={handleChipRemove}
                  onClearAll={handleClearAll}
                />
                <WorkflowTemplateCards
                  canCreate={canCreateExpress}
                  items={templateItems}
                  isLoading={isLoadingTemplates}
                  page={templatesPage}
                  pageSize={templatesPageSize}
                  hasNext={templatesHasNext}
                  onPageChange={setTemplatesPage}
                  onStart={(item) => {
                    if (!canCreateExpress) return
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
                    canDelete={canDelete}
                    onDelete={setDeletingRow}
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
                  if (!expressTemplate || !canCreateExpress) return
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

      {canDelete && (
        <HuemulAlertDialog
          open={!!deletingRow}
          onOpenChange={(open) => !open && setDeletingRow(null)}
          title={t("deleteDialog.title")}
          description={t("deleteDialog.description", { name: deletingRow?.document_name })}
          actionLabel={tCommon("delete")}
          actionIcon={Trash2}
          onAction={async () => {
            if (!deletingRow) return
            await deleteWorkflow.mutateAsync(deletingRow.document_id)
            if (selectedRow?.document_id === deletingRow.document_id) setSelectedRow(null)
          }}
        />
      )}
    </>
  )
}
