import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useOrganization } from "@/contexts/organization-context"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useTags, tagsQueryKeys } from "@/hooks/useTags"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { HuemulAccessDenied } from "@/huemul/components/huemul-access-denied"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"
import type { Tag } from "@/types/tags"

import {
  TagsPageHeader,
  TagsTable,
  TagsErrorState,
  TagsLoadingState,
  TagsCreateSheet,
  TagsEditSheet,
  TagsDeleteDialog,
} from "@/components/tags"

export default function TagsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { selectedOrganizationId } = useOrganization()
  const { canAccessPage, can, isLoading: isLoadingPermissions } = usePageAccess('tags')
  const queryClient = useQueryClient()

  const canList = can('listTags')
  const canCreate = can('createTag')
  const canUpdate = can('updateTag')
  const canDelete = can('deleteTag')

  const { data: tagsResponse, isLoading, isFetching, error } = useTags({
    page,
    page_size: pageSize,
    search: searchTerm || undefined,
    enabled: canList && !!selectedOrganizationId,
  })
  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!tagsResponse,
  })

  if (isLoadingPermissions) {
    return <TagsLoadingState />
  }

  if (!canAccessPage) {
    return <HuemulAccessDenied />
  }

  if (showPageLoader) {
    return <TagsLoadingState />
  }

  const tags = tagsResponse?.data ?? []

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: tagsQueryKeys.lists() })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <>
      <HuemulPageLayout
        header={
          <TagsPageHeader
            searchTerm={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value)
              setPage(1)
            }}
            tagsCount={tags.length}
            isLoading={isRefreshing || isFetching}
            onRefresh={handleRefresh}
            onCreateClick={() => setShowCreateDialog(true)}
            hasError={!!error}
            canCreate={canCreate}
          />
        }
        headerClassName="p-4 md:p-6 pb-0 md:pb-0"
        columns={[
          {
            content: error ? (
              <TagsErrorState error={error} onRetry={handleRefresh} />
            ) : (
              <TagsTable
                tags={tags}
                onEdit={setEditingTag}
                onDelete={setDeletingTag}
                canUpdate={canUpdate}
                canDelete={canDelete}
                isLoading={isTableLoading}
                isFetching={isTableFetching}
                searchTerm={searchTerm}
                pagination={{
                  page: tagsResponse?.page ?? page,
                  pageSize: tagsResponse?.page_size ?? pageSize,
                  hasNext: tagsResponse?.has_next,
                  hasPrevious: (tagsResponse?.page ?? page) > 1,
                  onPageChange: (newPage) => setPage(newPage),
                  onPageSizeChange: (newPageSize) => {
                    setPageSize(newPageSize)
                    setPage(1)
                  },
                  pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
                }}
              />
            ),
            className: "p-4 md:p-6 pt-0 md:pt-0",
          },
        ]}
      />

      <TagsCreateSheet
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        canCreate={canCreate}
      />

      <TagsEditSheet
        open={!!editingTag}
        onOpenChange={(open) => !open && setEditingTag(null)}
        tag={editingTag}
        canUpdate={canUpdate}
      />

      <TagsDeleteDialog
        open={!!deletingTag}
        onOpenChange={(open) => !open && setDeletingTag(null)}
        tag={deletingTag}
        canDelete={canDelete}
      />
    </>
  )
}
