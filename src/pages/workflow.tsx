"use client"

import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { Workflow as WorkflowIcon, Loader2, ShieldAlert } from "lucide-react"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useWorkflows, workflowQueryKeys } from "@/hooks/useWorkflows"
import { useWorkflowTemplates, useCreateTemplateExpress } from "@/hooks/useWorkflowTemplates"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { useOrgNavigate } from "@/hooks/useOrgRouter"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import { HuemulField } from "@/huemul/components/huemul-field"
import type { FetchOptionsParams, FetchOptionsResult } from "@/huemul/components/huemul-field"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"
import { getDocumentTypes } from "@/services/document-types"
import { WorkflowTable, WorkflowDetailPanel, WorkflowTemplateCards, WorkflowExpressSheet } from "@/components/workflow"
import type { WorkflowItem } from "@/types/workflow"
import type { WorkflowTemplateItem, CreateExpressBody } from "@/types/templates"

export default function WorkflowPage() {
  const { t } = useTranslation("workflow")
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const { canAccessAssets, isLoading: isLoadingPermissions } = useUserPermissions()
  const queryClient = useQueryClient()
  const navigate = useOrgNavigate()

  const [search, setSearch] = useState("")
  const [documentTypeId, setDocumentTypeId] = useState<string | null>(null)
  const [documentTypeLabel, setDocumentTypeLabel] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedRow, setSelectedRow] = useState<WorkflowItem | null>(null)
  const [expressTemplate, setExpressTemplate] = useState<WorkflowTemplateItem | null>(null)

  const fetchDocumentTypeOptions = useCallback(
    async ({ search: s }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getDocumentTypes({ search: s || undefined })
      return {
        options: (res.data ?? []).map((dt) => ({ value: dt.id, label: dt.name })),
        hasMore: false,
      }
    },
    [],
  )

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
    search: search || undefined,
    document_type_id: documentTypeId,
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

  const createExpress = useCreateTemplateExpress(selectedOrganizationId ?? "")

  const handleExpressSubmit = async (body: CreateExpressBody) => {
    if (!expressTemplate) return
    await new Promise<void>((resolve, reject) => {
      createExpress.mutate(
        { documentTypeId: expressTemplate.document_type_id, templateId: expressTemplate.id, body },
        {
          onSuccess: (result) => {
            resolve()
            setExpressTemplate(null)
            navigate(`/asset/${result.id}`)
          },
          onError: (err) => reject(err),
        },
      )
    })
  }

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
              refetch()
            }}
            isLoading={isFetching}
            hasError={!!error}
            searchConfig={{
              placeholder: t("header.searchPlaceholder"),
              value: search,
              onChange: (value) => {
                setSearch(value)
                setPage(1)
              },
            }}
          >
            <div className="w-full sm:w-56">
              <HuemulField
                type="async-combobox"
                label=""
                placeholder={t("header.documentTypePlaceholder")}
                value={documentTypeId ?? ""}
                onChange={(value) => {
                  setDocumentTypeId((value as string) || null)
                  setPage(1)
                }}
                selectedLabel={documentTypeLabel}
                onSelectedLabelChange={setDocumentTypeLabel}
                fetchOptions={fetchDocumentTypeOptions}
                searchOnEnter
                inputClassName="h-8 text-xs bg-white"
              />
            </div>
          </PageHeader>
        }
        headerClassName="p-2 sm:p-4 md:p-4 lg:p-6 pb-0 sm:pb-0 md:pb-0 lg:pb-0"
        columns={[
          {
            content: (
              <div className="flex flex-col h-full gap-4">
                <div className="shrink-0">
                  <WorkflowTemplateCards
                    items={templateItems}
                    isLoading={isLoadingTemplates}
                    onStart={(item) => setExpressTemplate(item)}
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
                    onSelectRow={(item) => setSelectedRow(item)}
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
            className: "p-2 sm:p-4 md:p-4 lg:p-6 pt-0 sm:pt-0 md:pt-0 lg:pt-0",
          },
          {
            content: selectedRow ? (
              <WorkflowDetailPanel row={selectedRow} onClose={() => setSelectedRow(null)} />
            ) : null,
            defaultSize: 40,
            minSize: 25,
            show: selectedRow != null,
          },
        ]}
      />

      <WorkflowExpressSheet
        template={expressTemplate}
        open={expressTemplate != null}
        onOpenChange={(open) => { if (!open) setExpressTemplate(null) }}
        onSubmit={handleExpressSubmit}
      />
    </>
  )
}
