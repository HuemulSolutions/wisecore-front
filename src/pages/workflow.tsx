"use client"

import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { useIsFetching, useQueryClient } from "@tanstack/react-query"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useOrganization } from "@/contexts/organization-context"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useOrgPath } from "@/hooks/useOrgRouter"
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
import { MediaListSheet } from "@/components/ui/media-list-sheet"
import {
  WorkflowTable,
  WorkflowDetailPanel,
  WorkflowLauncher,
  WorkflowShareDialog,
  WorkflowPageHeader,
  WorkflowAssetEditSheet,
} from "@/components/workflow"
import { buildTemplateShareUrl, buildExecutionShareUrl, buildExecutionSharePath } from "@/lib/workflow-share-url"
import type { WorkflowItem } from "@/types/workflow"
import type { WorkflowTemplateItem, CreateExpressResult } from "@/types/templates"

// Toasts del lanzador: centrados abajo, por encima de la paginación de la tabla.
const TOAST_DURATION_MS = 2800
// sonner solo acepta `offset` en <Toaster> (global); por toast se suma margen a
// los 24px por defecto para llegar a ~72px sobre el borde inferior.
const TOAST_STYLE = { marginBottom: 48 }

type SharingState =
  | { kind: "template"; url: string; name: string }
  | { kind: "execution"; url: string; name: string }

export default function WorkflowPage() {
  const { t } = useTranslation("workflow")
  const { t: tCommon } = useTranslation("common")
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const { canAccessPage, can, isLoading: isLoadingPermissions } = usePageAccess("workflow")
  // Paridad con el panel de detalle: mismo eje RBAC que gatea su botón Paperclip
  // (ver workflow-detail-panel.tsx) — acá gatea la misma acción en el menú de fila.
  const { can: canMedia } = usePageAccess("media")
  const buildPath = useOrgPath()
  const queryClient = useQueryClient()

  // Crear un express es la única razón por la que existen las tarjetas de
  // templates: sin `asset:c` no se listan ni se pega a GET /templates/.
  const canCreateExpress = can("createExpressAsset") && can("listTemplates")
  const canDelete = can("deleteAsset")
  const canUpdateAssetContent = can("updateAssetContent")

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedRow, setSelectedRow] = useState<WorkflowItem | null>(null)
  const [expressTemplate, setExpressTemplate] = useState<WorkflowTemplateItem | null>(null)
  const [expressDoc, setExpressDoc] = useState<CreateExpressResult | null>(null)
  const [deletingRow, setDeletingRow] = useState<WorkflowItem | null>(null)
  const [sharing, setSharing] = useState<SharingState | null>(null)
  const [mediaRow, setMediaRow] = useState<WorkflowItem | null>(null)
  const [editingRow, setEditingRow] = useState<WorkflowItem | null>(null)

  // Cierra «Ver todos» desde acá cuando el express se crea con éxito.
  const [closeLauncherDialog, setCloseLauncherDialog] = useState(0)

  // El launcher muestra sus propios toasts (Abrir / Reintentar).
  const createExpress = useCreateTemplateExpress(selectedOrganizationId ?? "", { silent: true })
  const { deleteWorkflow } = useWorkflowMutations(selectedOrganizationId ?? "")

  const startExpress = useCallback(
    (item: WorkflowTemplateItem, name: string, description?: string) => {
      if (!canCreateExpress) return
      createExpress
        .mutateAsync({
          documentTypeId: item.document_type_id,
          templateId: item.id,
          body: { name, description },
        })
        .then((doc) => {
          setCloseLauncherDialog((n) => n + 1)
          setSelectedRow(null)
          setExpressTemplate(item)
          setExpressDoc(doc)
        })
        .catch(() => {
          toast.error(t("launcher.createError"), {
            duration: TOAST_DURATION_MS,
            position: "bottom-center",
            style: TOAST_STYLE,
            action: { label: t("launcher.retry"), onClick: () => startExpress(item, name, description) },
          })
        })
    },
    // `createExpress.mutateAsync` es estable en react-query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canCreateExpress, t],
  )

  const handleStartTemplate = useCallback(
    (item: WorkflowTemplateItem) => {
      if (!canCreateExpress) return
      if (item.require_name_on_express) {
        // El panel pide el nombre (paso previo) y dispara `startExpress`.
        setCloseLauncherDialog((n) => n + 1)
        setSelectedRow(null)
        setExpressTemplate(item)
        setExpressDoc(null)
        return
      }
      startExpress(item, item.name)
    },
    [canCreateExpress, startExpress],
  )

  // Muestra siempre el diálogo con el link (copiar / abrir en pestaña nueva).
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

  // Misma ejecución en la página de assets, en pestaña nueva (paridad con el ícono del header del panel).
  const handleOpenAsset = useCallback(
    (item: WorkflowItem) => {
      window.open(
        buildPath(`/asset/${item.document_id}?execution=${encodeURIComponent(item.execution_id)}`),
        "_blank",
        "noopener,noreferrer",
      )
    },
    [buildPath],
  )

  // Vista a pantalla completa de la ejecución (ruta del link compartido), en pestaña nueva.
  const handleOpenFullscreen = useCallback(
    (item: WorkflowItem) => {
      window.open(buildPath(buildExecutionSharePath(item.document_id, item.execution_id)), "_blank", "noopener,noreferrer")
    },
    [buildPath],
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
      {/* Layout anidado (Patrón E, ver ia context/huemul-page-layout-guide.md):
          el header full-width y filtros+tabla viven en el layout interno, que
          es la primera columna del externo. El panel de detalle es la segunda
          columna del externo, sibling de ese layout interno — así ocupa toda
          la altura real de la página en vez de arrancar debajo del header. */}
      <HuemulPageLayout
        withHandle
        columns={[
          {
            content: (
              <HuemulPageLayout
                withHandle
                header={
                  <WorkflowPageHeader
                    count={items.length}
                    searchTerm={(values.search as string) || ""}
                    onSearchChange={(value) => handleFilterChange("search", value)}
                    activeCount={activeCount}
                    filtersOpen={filtersOpen}
                    onToggleFilters={() => setFiltersOpen(!filtersOpen)}
                    isLoading={isFetching || isFetchingTemplates}
                    onRefresh={() => {
                      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.listBase() })
                      queryClient.invalidateQueries({ queryKey: workflowTemplateQueryKeys.listBase() })
                    }}
                  />
                }
                headerClassName="p-4 md:p-6 pb-0 md:pb-0"
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
                    minSize: 30,
                    header: {
                      content: (
                        <WorkflowLauncher
                          canCreate={canCreateExpress}
                          onShare={handleShareTemplate}
                          startingTemplateId={startingTemplateId}
                          onStart={handleStartTemplate}
                          closeDialogSignal={closeLauncherDialog}
                        />
                      ),
                    },
                    content: (
                      <div className="flex flex-col h-full overflow-hidden gap-4">
                        <HuemulFilterChips
                          chips={chips}
                          onRemove={handleChipRemove}
                          onClearAll={handleClearAll}
                          className="px-4 pt-4 md:px-6"
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
                            canViewMedia={canMedia("listMedia")}
                            onViewMedia={setMediaRow}
                            canEditAsset={canUpdateAssetContent}
                            onEditAsset={setEditingRow}
                            canOpenAsset={can("readAsset")}
                            onOpenAsset={handleOpenAsset}
                            canOpenFullscreen={can("readAsset")}
                            onOpenFullscreen={handleOpenFullscreen}
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
                ]}
              />
            ),
            minSize: 45,
          },
          {
            content: selectedRow || expressTemplate ? (
              <WorkflowDetailPanel
                row={selectedRow}
                template={expressTemplate}
                createdDoc={expressDoc}
                isCreating={createExpress.isPending && createExpress.variables?.templateId === expressTemplate?.id}
                onSubmitName={(name, description) =>
                  expressTemplate && startExpress(expressTemplate, name, description)
                }
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

      {/* Paridad con el panel de detalle: mismos sheets que abren sus botones
          Paperclip/lápiz, ahora también alcanzables desde el menú de fila. */}
      <MediaListSheet
        open={!!mediaRow}
        onOpenChange={(open) => !open && setMediaRow(null)}
        organizationId={selectedOrganizationId ?? ""}
        level="execution"
        parentId={mediaRow?.execution_id ?? ""}
        parentLabel={mediaRow?.document_name}
        documentId={mediaRow?.document_id}
        documentLabel={mediaRow?.document_name}
        canCreate={canMedia("createMedia")}
        canUpdate={canMedia("updateMedia")}
        canDelete={canMedia("deleteMedia")}
      />

      <WorkflowAssetEditSheet
        open={!!editingRow}
        onOpenChange={(open) => !open && setEditingRow(null)}
        canSave={canUpdateAssetContent}
        documentId={editingRow?.document_id ?? ""}
        currentName={editingRow?.document_name ?? ""}
        currentInternalCode={editingRow?.internal_code}
        onUpdated={() => {}}
      />
    </>
  )
}
