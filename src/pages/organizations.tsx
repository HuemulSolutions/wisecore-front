"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useOrganization } from "@/contexts/organization-context"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { useUrlTab } from "@/hooks/useUrlTab"
import { useOrganizations, useOrganizationsLookup, useOrganizationMutations } from "@/hooks/useOrganizations"
import { useOrganizationDetailsForm } from "@/hooks/useOrganizationDetailsForm"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"

// Components
import {
  OrganizationsTable,
  OrganizationPageHeader,
  OrganizationPageSkeleton,
  OrganizationPageEmptyState,
  OrganizationContentEmptyState,
  CreateOrganizationDialog,
  DeleteOrganizationDialog,
  OrganizationDetailPanel,
  type OrganizationDetailPanelGuardApi,
} from "@/components/organization"
import type { Organization, OrganizationDetailTab } from "@/types/organizations"

const ORGANIZATION_DETAIL_TABS: readonly OrganizationDetailTab[] = ['details', 'users']

export default function Organizations() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deletingOrganization, setDeletingOrganization] = useState<Organization | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [searchParams, setSearchParams] = useSearchParams()

  // La organización/tab seleccionados viven en la URL (?organization=<id>&tab=users),
  // espejo de /users y /roles. Nombre distinto de `selectedOrganizationId` (la
  // organización ACTIVA del usuario, del context) para no confundirlos.
  const panelOrganizationId = searchParams.get('organization')
  const { tab: detailTab, setTab: setDetailTab, applyTab } = useUrlTab({
    tabs: ORGANIZATION_DETAIL_TABS,
    fallback: 'details',
  })

  // Get permissions and organization context
  const { canAccessPage, can, isLoading: isLoadingPermissions } = usePageAccess('organizations')
  // Asignar/quitar usuarios de una organización (membership, distinto de
  // "Hacer admin") es cross-org y root-admin-only — mismo eje que
  // `canManageRootAdmin` en /users, no una feature RBAC nueva.
  const { isRootAdmin } = useUserPermissions()
  const { selectedOrganizationId, organizationToken } = useOrganization()

  // Permisos específicos
  const canListOrgs = can('listOrganizations')
  const canUpdateOrg = can('updateOrganization')
  const canDeleteOrg = can('deleteOrganization')
  const canCreateOrg = can('createOrganization')
  const canListOrgUsers = can('listOrganizationUsers')
  const canSetOrgAdmin = can('setOrganizationAdmin')

  // Fetch organizations - solo si tiene permisos de listar
  const { data: organizationsResponse, isLoading, isFetching, error: queryError, refetch } = useOrganizations({
    organizationId: selectedOrganizationId,
    page,
    pageSize,
    search: searchTerm || undefined,
    enabled: !!selectedOrganizationId && !!organizationToken && canListOrgs,
  })

  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!organizationsResponse,
  })

  const organizations = (organizationsResponse?.data || []) as Organization[]

  // Deep-link: no existe GET /organizations/{id} — se resuelve contra un
  // catálogo acotado (useOrganizationsLookup) cuando el id no está en la
  // página actual de la tabla. Espejo acotado de useRolesMap en /roles.
  const foundInPage = organizations.find((o) => o.id === panelOrganizationId) ?? null
  const needsLookup = !!panelOrganizationId && !foundInPage
  const { byId: organizationsById, isFetched: lookupFetched } = useOrganizationsLookup(canListOrgs && needsLookup)
  const selectedOrganization = foundInPage ?? (panelOrganizationId ? organizationsById[panelOrganizationId] ?? null : null)

  const { createOrganization, deleteOrganization } = useOrganizationMutations()

  // Form del tab Detalles: vive en la página (no en el panel), espejo de
  // `detailsForm` en roles.tsx — así el estado sucio sobrevive al cambio de tab.
  const detailsForm = useOrganizationDetailsForm(selectedOrganization, canUpdateOrg)

  // Guard de descarte: registrado por el panel (ver
  // ia context/sheet-footer-batch-save-guide.md), consultado acá antes de
  // cambiar de fila.
  const guardRef = useRef<OrganizationDetailPanelGuardApi | null>(null)
  const onRegisterGuard = useCallback((api: OrganizationDetailPanelGuardApi | null) => {
    guardRef.current = api
  }, [])

  // Navegación del panel de detalle: siempre a través de la URL.
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

  // Red de seguridad: id inexistente/borrado (link viejo, otra org) → se
  // limpia la URL en vez de dejar el sheet vacío.
  useEffect(() => {
    if (!panelOrganizationId || selectedOrganization) return
    if (isTableLoading || isTableFetching) return
    if (needsLookup && !lookupFetched) return
    navigateToOrganization(null)
  }, [panelOrganizationId, selectedOrganization, isTableLoading, isTableFetching, needsLookup, lookupFetched, navigateToOrganization])

  // Loading state for permissions
  if (isLoadingPermissions) {
    return <OrganizationPageSkeleton />
  }

  // Access check - need at least read/list permission
  if (!canAccessPage) {
    return <OrganizationPageEmptyState type="access-denied" />
  }

  // Organization check
  if (!selectedOrganizationId || !organizationToken) {
    return <OrganizationPageEmptyState type="no-organization" />
  }

  // Loading state
  if (showPageLoader) {
    return <OrganizationPageSkeleton />
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

  // Function to refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <>
      <HuemulPageLayout
        header={
          <OrganizationPageHeader
            organizationCount={organizationsResponse?.total || organizations.length}
            onCreateOrganization={() => setShowCreateDialog(true)}
            onRefresh={handleRefresh}
            isLoading={isRefreshing || isFetching}
            searchTerm={searchTerm}
            onSearchChange={(value: string) => {
              setSearchTerm(value)
              setPage(1)
            }}
            canManage={canCreateOrg}
          />
        }
        headerClassName="p-4 md:p-6 pb-0 md:pb-0"
        columns={[
          {
            content: queryError ? (
              <OrganizationContentEmptyState
                type="error"
                message={(queryError as Error).message}
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
            ),
            className: "flex flex-col",
            minSize: 45,
          },
        ]}
      />

      {/* El detalle de la organización seleccionada se muestra en un
          HuemulSheet (no como columna del layout) — se mantiene montado con
          `open` controlado por la URL para que la animación de cierre corra. */}
      <OrganizationDetailPanel
        open={!!panelOrganizationId}
        organization={selectedOrganization}
        activeTab={detailTab}
        onTabChange={handleTabChange}
        onClose={handleClosePanel}
        onDeleteOrganization={() => selectedOrganization && setDeletingOrganization(selectedOrganization)}
        detailsForm={detailsForm}
        canUpdate={canUpdateOrg}
        canDelete={canDeleteOrg}
        canListUsers={canListOrgUsers}
        canSetAdmin={canSetOrgAdmin}
        canManageMembers={isRootAdmin}
        // Los límites de sistema (max_users/token_limit) solo se editan desde
        // /global-admin — esta página no los expone.
        canManageSystemLimits={false}
        onRegisterGuard={onRegisterGuard}
      />

      {/* Dialogs */}
      <CreateOrganizationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={(data) => createOrganization.mutate(data, { onSuccess: () => setShowCreateDialog(false) })}
        isPending={createOrganization.isPending}
        canCreate={canCreateOrg}
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
        canDelete={canDeleteOrg}
      />
    </>
  )
}
