"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useCanvasList, canvasQueryKeys } from "@/hooks/useCanvas"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"

import {
  CanvasPageHeader,
  CanvasTable,
  CanvasPageSkeleton,
  CanvasPageEmptyState,
  CanvasContentEmptyState,
  CanvasPageDialogs,
  type CanvasPageState,
} from "@/components/canvas"
import type { Canvas } from "@/types/canvas"

export default function CanvasPage() {
  const [state, setState] = useState<CanvasPageState>({
    searchTerm: "",
    showCreateDialog: false,
    editingCanvas: null,
    deletingCanvas: null,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const { selectedOrganizationId, organizationToken } = useOrganization()
  const { canAccessCanvas, isOrgAdmin, hasPermission, isLoading: isLoadingPermissions } = useUserPermissions()
  const queryClient = useQueryClient()

  const canManage = isOrgAdmin || hasPermission('canvas:c') || hasPermission('canvas:u') || hasPermission('canvas:d')

  const { data: canvasResponse, isLoading, isFetching, error } = useCanvasList(
    selectedOrganizationId ?? "",
    {
      enabled: !!selectedOrganizationId && !!organizationToken && canAccessCanvas,
      page,
      pageSize,
      search: state.searchTerm || undefined,
    }
  )

  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!canvasResponse,
  })

  // Loading permissions
  if (isLoadingPermissions) return <CanvasPageSkeleton />

  // Access check
  if (!canAccessCanvas) return <CanvasPageEmptyState type="access-denied" />

  // Organization check
  if (!selectedOrganizationId || !organizationToken) return <CanvasPageEmptyState type="no-organization" />

  // Initial load
  if (showPageLoader) return <CanvasPageSkeleton />

  const items = canvasResponse?.data ?? []

  const updateState = (updates: Partial<CanvasPageState>) =>
    setState((prev) => ({ ...prev, ...updates }))

  const closeDialog = (dialog: keyof CanvasPageState) =>
    setState((prev) => ({ ...prev, [dialog]: null }))

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: canvasQueryKeys.listBase() })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <>
      <HuemulPageLayout
        header={
          <CanvasPageHeader
            canvasCount={items.length}
            onCreateCanvas={() => updateState({ showCreateDialog: true })}
            onRefresh={handleRefresh}
            isLoading={isRefreshing || isFetching}
            searchTerm={state.searchTerm}
            onSearchChange={(value) => {
              updateState({ searchTerm: value })
              setPage(1)
            }}
            canManage={canManage}
          />
        }
        headerClassName="p-6 md:p-8 pb-0 md:pb-0"
        columns={[
          {
            content: error ? (
              <CanvasContentEmptyState
                type="error"
                message={(error as Error).message}
                onRetry={handleRefresh}
              />
            ) : items.length === 0 && !state.searchTerm ? (
              <CanvasContentEmptyState
                type="empty"
                onCreateFirst={canManage ? () => updateState({ showCreateDialog: true }) : undefined}
              />
            ) : items.length === 0 && state.searchTerm ? (
              <CanvasContentEmptyState
                type="no-results"
                onClearFilters={() => {
                  updateState({ searchTerm: "" })
                  setPage(1)
                }}
              />
            ) : (
              <CanvasTable
                items={items}
                onEdit={(canvas: Canvas) => updateState({ editingCanvas: canvas })}
                onDelete={(canvas: Canvas) => updateState({ deletingCanvas: canvas })}
                canManage={canManage}
                isLoading={isTableLoading}
                isFetching={isTableFetching}
                pagination={{
                  page: canvasResponse?.page ?? page,
                  pageSize: canvasResponse?.page_size ?? pageSize,
                  hasNext: canvasResponse?.has_next,
                  hasPrevious: (canvasResponse?.page ?? page) > 1,
                  onPageChange: (newPage) => setPage(newPage),
                  onPageSizeChange: (newPageSize) => {
                    setPageSize(newPageSize)
                    setPage(1)
                  },
                  pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
                }}
              />
            ),
            className: "p-6 md:p-8 pt-0 md:pt-0",
          },
        ]}
      />

      <CanvasPageDialogs
        state={state}
        organizationId={selectedOrganizationId}
        onCloseDialog={closeDialog}
      />
    </>
  )
}
