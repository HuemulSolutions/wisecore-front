"use client"

import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { useIsFetching, useQueryClient } from "@tanstack/react-query"
import { Loader2, Trash2 } from "lucide-react"
import { useOrganization } from "@/contexts/organization-context"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useWorkflows, useWorkflowMutations, workflowQueryKeys } from "@/hooks/useWorkflows"
import { useCreateTemplateExpress, workflowTemplateQueryKeys } from "@/hooks/useWorkflowTemplates"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { useWorkflowFilters } from "@/components/workflow/hooks/useWorkflowFilters"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { HuemulAccessDenied } from "@/huemul/components/huemul-access-denied"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { HuemulFilterChips } from "@/huemul/components/huemul-filter-chips"
import { HuemulFilterPanel } from "@/huemul/components/huemul-filter-panel"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"
import { WorkflowTable, WorkflowDetailPanel, WorkflowLauncher, WorkflowShareDialog, WorkflowToolbar } from "@/components/workflow"
import { buildTemplateShareUrl, buildExecutionShareUrl } from "@/lib/workflow-share-url"
import type { WorkflowItem } from "@/types/workflow"
import type { WorkflowTemplateItem, CreateExpressResult } from "@/types/templates"

type SharingState =
  | { kind: "template"; url: string; name: string }
  | { kind: "execution"; url: string; name: string }

export default function WorkflowPage() {
  const { t } = useTranslation("workflow")
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
  const [sharing, setSharing] = useState<SharingState | null>(null)

  const createExpress = useCreateTemplateExpress(selectedOrganizationId ?? "")
  const { deleteWorkflow } = useWorkflowMutations(selectedOrganizationId ?? "")

  const handleShareTemplate = useCallback(
    (item: WorkflowTemplateItem) => {
      if (!selectedOrganizationId) return
      setSharing({
        kind: "template",
        url: buildTemplateShareUrl(selectedOrganizationId, item.document_type_id, item.id),
        name: item.name,
      })
    },
    [selectedOrganizationId],
  )

  const handleShareExecution = useCallback(
    (item: WorkflowItem) => {
      if (!selectedOrganizationId) return
      setSharing({
        kind: "execution",
        url: buildExecutionShareUrl(selectedOrganizationId, item.document_id, item.execution_id),
        name: item.document_name,
      })
    },
    [selectedOrganizationId],
  )

  const {
    filterDefs,
    values,
    filtersOpen,
    setFiltersOpen,
    handleFilterChange,
    handleChipRemove,
    handleClearAll,
    chips,
    activeCount,
    setSelectedLabel,
    queryParams,
  } = useWorkflowFilters({
    can,
    selectedOrganizationId,
    onPageReset: () => setPage(1),
  })

  // `activeCount` cuenta solo los chips del panel lateral; la búsqueda es un filtro
  // de toolbar y queda fuera, así que se agrega aparte.
  const hasActiveFilters = activeCount > 0 || !!(values.search as string)

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
    ...queryParams,
  })

  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!workflowsResponse,
  })

  const items = workflowsResponse?.data ?? []

  // El launcher hace sus propias queries (búsqueda/filtro/paginación
  // server-side); aquí solo se refleja su actividad en el botón de refresh.
  const isFetchingTemplates = useIsFetching({ queryKey: workflowTemplateQueryKeys.listBase() }) > 0
  const startingTemplateId = createExpress.isPending ? (createExpress.variables?.templateId ?? null) : null

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
        withHandle
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
            minSize: 30,
            header: {
              content: (
                <>
                  <WorkflowToolbar
                    filters={filterDefs}
                    values={values}
                    onChange={handleFilterChange}
                    onSelectedLabel={setSelectedLabel}
                    activeCount={activeCount}
                    filtersOpen={filtersOpen}
                    onToggleFilters={() => setFiltersOpen(!filtersOpen)}
                    isRefreshing={isFetching || isFetchingTemplates}
                    onRefresh={() => {
                      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.listBase() })
                      queryClient.invalidateQueries({ queryKey: workflowTemplateQueryKeys.listBase() })
                    }}
                  />
                  <WorkflowLauncher
                    canCreate={canCreateExpress}
                    onShare={handleShareTemplate}
                    startingTemplateId={startingTemplateId}
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
                </>
              ),
            },
            content: (
              <div className="flex flex-col h-full overflow-hidden p-2 sm:p-4 md:p-4 lg:p-6 gap-4">
                <HuemulFilterChips
                  chips={chips}
                  onRemove={handleChipRemove}
                  onClearAll={handleClearAll}
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
                    onShare={handleShareExecution}
                    hasActiveFilters={hasActiveFilters}
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

      <WorkflowShareDialog
        open={!!sharing}
        onOpenChange={(open) => !open && setSharing(null)}
        url={sharing?.url ?? null}
        description={
          sharing?.kind === "template"
            ? t("share.templateDescription", { name: sharing.name })
            : t("share.executionDescription", { name: sharing?.name })
        }
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
            if (!deletingRow || !canDelete) return
            await deleteWorkflow.mutateAsync(deletingRow.document_id)
            if (selectedRow?.document_id === deletingRow.document_id) setSelectedRow(null)
          }}
        />
      )}
    </>
  )
}
