"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { Plus, Building2 } from "lucide-react"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { useUrlTab } from "@/hooks/useUrlTab"
import { useOrganizations, useOrganizationsLookup, useOrganizationMutations } from "@/hooks/useOrganizations"
import { useOrganizationDetailsForm } from "@/hooks/useOrganizationDetailsForm"

import {
  OrganizationsTable,
  OrganizationPageEmptyState,
  OrganizationContentEmptyState,
  CreateOrganizationDialog,
  DeleteOrganizationDialog,
  OrganizationDetailPanel,
  type OrganizationDetailPanelGuardApi,
  type Organization,
} from "@/components/organization"
import type { OrganizationDetailTab } from "@/types/organizations"

interface GlobalAdminOrganizationsSectionProps {
  /**
   * Único eje de permisos de la sección: `/global-admin` es root-admin-only y
   * NO org-scoped, así que `organization:u`/`organization:d` no aplican acá.
   * Ver ia context/rbac-audit-guide.md.
   */
  canManage: boolean
}

const ORGANIZATION_DETAIL_TABS: readonly OrganizationDetailTab[] = ['details', 'users']

/**
 * Sección Organizaciones de `/global-admin` — maestro-detalle, espejo de
 * `/organizations` (misma tabla `OrganizationsTable` y mismo
 * `OrganizationDetailPanel`), con `canManageSystemLimits`/`canManageMembers`/
 * `canSetAdmin` en `true`: acá SÍ se editan límites de sistema y se
 * asigna/quita membership cross-org — capacidades que `/organizations` no
 * ofrece a un admin de organización normal.
 */
export function GlobalAdminOrganizationsSection({ canManage }: GlobalAdminOrganizationsSectionProps) {
  const { t } = useTranslation(['organizations', 'global-admin'])
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deletingOrganization, setDeletingOrganization] = useState<Organization | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [searchParams, setSearchParams] = useSearchParams()

  // Espejo de /organizations: la organización/tab del panel viven en la URL.
  const panelOrganizationId = searchParams.get('organization')
  const { tab: detailTab, setTab: setDetailTab, applyTab } = useUrlTab({
    tabs: ORGANIZATION_DETAIL_TABS,
    fallback: 'details',
  })

  const { data: organizationsResponse, isLoading, isFetching, error, refetch } = useOrganizations({
    page,
    pageSize,
    search: searchTerm,
    enabled: canManage,
  })

  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!organizationsResponse,
  })

  const organizations = (organizationsResponse?.data || []) as Organization[]

  // Deep-link: espejo de /organizations (useOrganizationsLookup).
  const foundInPage = organizations.find((o) => o.id === panelOrganizationId) ?? null
  const needsLookup = !!panelOrganizationId && !foundInPage
  const { byId: organizationsById, isFetched: lookupFetched } = useOrganizationsLookup(canManage && needsLookup)
  const selectedOrganization = foundInPage ?? (panelOrganizationId ? organizationsById[panelOrganizationId] ?? null : null)

  const { createOrganization, deleteOrganization } = useOrganizationMutations()

  // `manageSystemLimits: true` — a diferencia de /organizations, acá se
  // editan max_users/token_limit.
  const detailsForm = useOrganizationDetailsForm(selectedOrganization, canManage, true)

  const guardRef = useRef<OrganizationDetailPanelGuardApi | null>(null)
  const onRegisterGuard = useCallback((api: OrganizationDetailPanelGuardApi | null) => {
    guardRef.current = api
  }, [])

  const navigateToOrganization = useCallback((id: string | null, tab: OrganizationDetailTab = 'details') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (id) {
        next.set('organization', id)
        applyTab(next, tab)
      } else {
        next.delete('organization')
        next.delete('tab')
      }
      return next
    }, { replace: true })
  }, [setSearchParams, applyTab])

  useEffect(() => {
    if (!panelOrganizationId || selectedOrganization) return
    if (isTableLoading || isTableFetching) return
    if (needsLookup && !lookupFetched) return
    navigateToOrganization(null)
  }, [panelOrganizationId, selectedOrganization, isTableLoading, isTableFetching, needsLookup, lookupFetched, navigateToOrganization])

  if (!canManage) {
    return <OrganizationPageEmptyState type="access-denied" />
  }

  if (showPageLoader) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  const handleSelectOrganization = (organization: Organization, tab?: OrganizationDetailTab) => {
    const targetTab = tab ?? (organization.id === panelOrganizationId ? detailTab : 'details')
    const proceed = () => navigateToOrganization(organization.id, targetTab)
    if (guardRef.current) guardRef.current.attemptNavigate(proceed)
    else proceed()
  }

  const handleClosePanel = () => navigateToOrganization(null)

  const handleTabChange = (tab: OrganizationDetailTab) => {
    if (!panelOrganizationId) return
    setDetailTab(tab)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <div className="shrink-0">
        <PageHeader
          icon={Building2}
          title={t('header.title')}
          subtitle={t('global-admin:sections.organizationsSubtitle')}
          badges={[
            { label: "", value: organizationsResponse?.total ?? organizations.length }
          ]}
          onRefresh={handleRefresh}
          isLoading={isRefreshing || isFetching}
          primaryAction={canManage ? {
            label: t('header.createOrganization'),
            icon: Plus,
            onClick: () => setShowCreateDialog(true)
          } : undefined}
          searchConfig={{
            placeholder: t('header.searchPlaceholder'),
            value: searchTerm,
            onChange: (value: string) => {
              setSearchTerm(value)
              setPage(1)
            },
            triggerOnEnter: true,
          }}
        />
      </div>

      {error ? (
        <OrganizationContentEmptyState
          type="error"
          message={(error as Error).message}
          onRetry={handleRefresh}
        />
      ) : (
        <OrganizationsTable
          organizations={organizations}
          onSelectOrganization={handleSelectOrganization}
          selectedOrganizationId={panelOrganizationId}
          isTableLoading={isTableLoading}
          isTableFetching={isTableFetching}
          pagination={{
            page: organizationsResponse?.page || page,
            pageSize: organizationsResponse?.page_size || pageSize,
            hasNext: organizationsResponse?.has_next,
            hasPrevious: (organizationsResponse?.page || page) > 1,
            onPageChange: (newPage: number) => setPage(newPage),
            onPageSizeChange: (newPageSize: number) => {
              setPageSize(newPageSize)
              setPage(1)
            },
            pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS
          }}
        />
      )}

      <OrganizationDetailPanel
        open={!!panelOrganizationId}
        organization={selectedOrganization}
        activeTab={detailTab}
        onTabChange={handleTabChange}
        onClose={handleClosePanel}
        onDeleteOrganization={() => selectedOrganization && setDeletingOrganization(selectedOrganization)}
        detailsForm={detailsForm}
        canUpdate={canManage}
        canDelete={canManage}
        canListUsers={canManage}
        canSetAdmin={canManage}
        canManageMembers={canManage}
        canManageSystemLimits={canManage}
        onRegisterGuard={onRegisterGuard}
      />

      <CreateOrganizationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={(data) => createOrganization.mutate(data, { onSuccess: () => setShowCreateDialog(false) })}
        isPending={createOrganization.isPending}
        canCreate={canManage}
      />

      <DeleteOrganizationDialog
        open={!!deletingOrganization}
        onOpenChange={(open) => !open && setDeletingOrganization(null)}
        organization={deletingOrganization}
        onConfirm={async () => {
          if (!deletingOrganization) return
          const isSelected = deletingOrganization.id === selectedOrganization?.id
          await deleteOrganization.mutateAsync(deletingOrganization.id)
          setDeletingOrganization(null)
          if (isSelected) navigateToOrganization(null)
        }}
        canDelete={canManage}
      />
    </div>
  )
}
