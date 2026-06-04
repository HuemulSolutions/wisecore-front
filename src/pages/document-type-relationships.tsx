"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { GitMerge } from "lucide-react"
import { useOrganization } from "@/contexts/organization-context"
import { useDocumentTypes } from "@/hooks/useDocumentTypes"
import { AssetTypeSidebar, RelationshipsCanvas } from "@/components/document-type-relationships"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { HuemulPagination } from "@/huemul/components/huemul-pagination"
import { HuemulField } from "@/huemul/components/huemul-field"

const DEFAULT_PAGE_SIZE = 100

export default function DocumentTypeRelationshipsPage() {
  const { t } = useTranslation("document-type-relationships")
  const { selectedOrganizationId } = useOrganization()

  // Search input (typed) vs committed search (sent to API on Enter)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")

  const { data: docTypesResponse, isLoading, isFetching, refetch } = useDocumentTypes({ search })
  const documentTypes = docTypesResponse?.data ?? []

  // Pagination state
  const [page, setPage] = useState(1)
  const pageSize = DEFAULT_PAGE_SIZE

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const totalItems = documentTypes.length
  const hasNext = page * pageSize < totalItems
  const hasPrevious = page > 1

  if (isLoading && !docTypesResponse) return <PageSkeleton />

  return (
    <HuemulPageLayout
      header={
        <div className="flex items-center gap-3 px-6 py-4">
          <GitMerge className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-base font-semibold">{t("header.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("header.subtitle")}</p>
          </div>
        </div>
      }
      columns={[
        {
          header: {
            content: (
              <div className="px-3 py-2 border-b bg-muted/20">
                <form onSubmit={handleSearchSubmit}>
                  <HuemulField
                    type="text"
                    value={searchInput}
                    onChange={(v) => setSearchInput(v as string)}
                    placeholder={t("header.searchPlaceholder")}
                    className="gap-0"
                    inputClassName="h-8 text-xs"
                  />
                </form>
              </div>
            ),
          },
          content: (
            <AssetTypeSidebar
              items={documentTypes}
              isLoading={isLoading}
              isFetching={isFetching}
              page={page}
              pageSize={pageSize}
              onRefresh={refetch}
            />
          ),
          defaultSize: 20,
          minSize: 15,
          maxSize: 35,
          className: "overflow-hidden",
          footer: {
            content: (
              <HuemulPagination
                page={page}
                pageSize={pageSize}
                hasNext={hasNext}
                hasPrevious={hasPrevious}
                onPageChange={setPage}
              />
            ),
          },
        },
        {
          content: (
            <RelationshipsCanvas
              organizationId={selectedOrganizationId ?? ""}
              documentTypes={documentTypes}
            />
          ),
          defaultSize: 80,
          minSize: 50,
          className: "overflow-hidden",
        },
      ]}
    />
  )
}
