import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Library, Plus } from "lucide-react"
import { useOrganization } from "@/contexts/organization-context"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useOrgNavigate } from "@/hooks/useOrgRouter"
import { useCollections } from "@/hooks/useCollections"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { HuemulAccessDenied } from "@/huemul/components/huemul-access-denied"
import { HuemulSegmentedControl } from "@/huemul/components/huemul-segmented-control"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { CollectionCard, CollectionFormSheet, CollectionsErrorState } from "@/components/collections"
import type { Collection, CollectionAudience } from "@/types/collections"

const PAGE_SIZE = 60

type AudienceFilter = "all" | CollectionAudience

export default function CollectionsPage() {
  const { t } = useTranslation(["collections", "common"])
  const navigate = useOrgNavigate()
  const { selectedOrganizationId } = useOrganization()
  const { canAccessPage, can, isLoading: isLoadingPermissions } = usePageAccess("collections")
  const [search, setSearch] = useState("")
  const [audience, setAudience] = useState<AudienceFilter>("all")
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)

  const canCreate = can("createCollection")
  const { data, isLoading, isFetching, error, refetch } = useCollections({
    page,
    page_size: PAGE_SIZE,
    search: search || undefined,
    audience: audience === "all" ? undefined : audience,
    enabled: can("listCollections") && !!selectedOrganizationId,
  })

  if (isLoadingPermissions) return <PageSkeleton showFilters />
  if (!canAccessPage || !can("listCollections")) return <HuemulAccessDenied />

  const collections = data?.data ?? []
  const openCollection = (collection: Collection) => navigate(`/collections/${collection.id}`)
  const hasFilters = !!search || audience !== "all"

  const content = error ? (
    <CollectionsErrorState error={error} onRetry={() => refetch()} />
  ) : isLoading ? (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-40 rounded-xl" />
      ))}
    </div>
  ) : collections.length === 0 ? (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
      <Library className="size-10 text-muted-foreground/60" />
      <p className="text-base font-medium">{hasFilters ? t("empty.noResults") : t("empty.title")}</p>
      {!hasFilters && <p className="max-w-md text-sm text-muted-foreground">{t("empty.description")}</p>}
      {!hasFilters && canCreate && (
        <HuemulButton className="mt-2" onClick={() => setShowCreate(true)} icon={Plus} label={t("header.newCollection")} />
      )}
    </div>
  ) : (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} onOpen={openCollection} />
        ))}
      </div>
      {(page > 1 || data?.has_next) && (
        <div className="mt-6 flex justify-center gap-2">
          <HuemulButton variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)} label={t("common:previous")} />
          <HuemulButton variant="outline" disabled={!data?.has_next} onClick={() => setPage(page + 1)} label={t("common:next")} />
        </div>
      )}
    </>
  )

  return (
    <>
      <HuemulPageLayout
        header={
          <PageHeader
            icon={Library}
            title={t("header.title")}
            subtitle={t("header.subtitle")}
            badges={[{ label: "", value: t("header.count", { count: collections.length }) }]}
            onRefresh={() => refetch()}
            isLoading={isFetching}
            hasError={!!error}
            primaryAction={canCreate ? { label: t("header.newCollection"), icon: Plus, onClick: () => setShowCreate(true) } : undefined}
            searchConfig={{
              placeholder: t("header.searchPlaceholder"),
              value: search,
              onChange: (value) => {
                setSearch(value)
                setPage(1)
              },
              triggerOnEnter: true,
            }}
          />
        }
        headerClassName="p-4 md:p-6 pb-0 md:pb-0"
        columns={[
          {
            content: (
              <div className="flex flex-col">
                <HuemulSegmentedControl<AudienceFilter>
                  className="mb-4 self-start"
                  value={audience}
                  ariaLabel={t("form.audience")}
                  onChange={(value) => {
                    setAudience(value)
                    setPage(1)
                  }}
                  options={[
                    { value: "all", label: t("filter.all") },
                    { value: "human", label: t("filter.human") },
                    { value: "agent", label: t("filter.agent") },
                  ]}
                />
                {content}
              </div>
            ),
            className: "p-4 md:p-6 pt-0 md:pt-0",
          },
        ]}
      />

      <CollectionFormSheet
        open={showCreate}
        onOpenChange={setShowCreate}
        collection={null}
        canManageAgentCollections={can("createAgentCollection")}
        onSaved={(collection) => openCollection(collection)}
      />
    </>
  )
}
