import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Building2 } from "lucide-react"
import { useAuthTypes } from "@/hooks/useAuthTypes"
import { useOrganization } from "@/contexts/organization-context"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { AuthTypeFormDialog } from "@/components/auth-types/auth-types-form-dialog"
import { DeleteAuthTypeDialog } from "@/components/auth-types/auth-types-delete-dialog"
import type { AuthType } from "@/services/auth-types"

import { AuthTypesSearch } from "@/components/auth-types/auth-types-search"
import { AuthTypesTable } from "@/components/auth-types/auth-types-table"
import { AuthTypesLoadingState } from "@/components/auth-types/auth-types-loading-state"
import { AuthTypesErrorState } from "@/components/auth-types/auth-types-error-state"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { HuemulAccessDenied } from "@/huemul/components/huemul-access-denied"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"

/**
 * Conexiones de autenticación de la organización activa.
 *
 * Regla de aislamiento por organización: todo usuario, el root admin incluido,
 * ve y administra solo las conexiones de la organización en la que está
 * logueado (el backend las toma del claim `org_id` del token de organización).
 * Sin organización activa no hay nada que listar: la página lo dice y no
 * consulta. No existe un modo "todas las organizaciones".
 */
export default function AuthTypes() {
  const { t } = useTranslation('auth-types')
  const [inputSearch, setInputSearch] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [editingAuthType, setEditingAuthType] = useState<AuthType | null>(null)
  const [deletingAuthType, setDeletingAuthType] = useState<AuthType | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { canAccessPage: canManageAuthTypes, isLoading: isLoadingPermissions } = usePageAccess('auth-types')
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const hasOrganization = !!selectedOrganizationId && !!organizationToken

  // Solo con organización activa y permiso de administración (root u org admin).
  const { data: authTypes = [], isLoading, isFetching, error, refetch } = useAuthTypes({
    enabled: canManageAuthTypes && hasOrganization,
    search: searchTerm || undefined,
  })

  const pagedAuthTypes = useMemo(
    () => authTypes.slice((page - 1) * pageSize, page * pageSize),
    [authTypes, page, pageSize]
  )

  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: authTypes.length > 0,
  })

  // Mostrar loading mientras se cargan los permisos
  if (isLoadingPermissions) {
    return <AuthTypesLoadingState />
  }

  // Verificar si el usuario puede administrar conexiones (root u org admin)
  if (!canManageAuthTypes) {
    return <HuemulAccessDenied />
  }

  // Sin organización activa (p. ej. `/_/auth-types` con solo el token de login)
  // no hay conexiones que mostrar, tampoco para el root admin.
  if (!hasOrganization) {
    return (
      <div className="flex flex-1 items-center justify-center p-6" data-testid="auth-types-organization-required">
        <div className="text-center max-w-md">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden />
          <h2 className="text-xl font-bold text-foreground mb-2">{t('emptyState.organizationRequired')}</h2>
          <p className="text-muted-foreground">{t('emptyState.organizationRequiredDescription')}</p>
        </div>
      </div>
    )
  }

  if (showPageLoader) {
    return <AuthTypesLoadingState />
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
          <AuthTypesSearch
            searchTerm={inputSearch}
            onSearchChange={(value) => {
              setInputSearch(value)
              setSearchTerm(value)
              setPage(1)
            }}
            authTypesCount={error ? 0 : authTypes.length}
            isLoading={isRefreshing || isFetching}
            onRefresh={handleRefresh}
            onCreateClick={() => setIsCreateDialogOpen(true)}
            hasError={!!error}
            canManage={canManageAuthTypes}
          />
        }
        headerClassName="p-4 md:p-6 pb-0 md:pb-0"
        columns={[
          {
            content: error ? (
              <AuthTypesErrorState error={error} onRetry={handleRefresh} />
            ) : (
              <AuthTypesTable
                authTypes={pagedAuthTypes}
                onEdit={setEditingAuthType}
                onDelete={setDeletingAuthType}
                canManage={canManageAuthTypes}
                isLoading={isTableLoading}
                isFetching={isTableFetching}
                pagination={{
                  page,
                  pageSize,
                  totalItems: authTypes.length,
                  onPageChange: setPage,
                  onPageSizeChange: (size) => { setPageSize(size); setPage(1) },
                  pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
                }}
              />
            ),
            className: "p-4 md:p-6 pt-0 md:pt-0",
          },
        ]}
      />

      <AuthTypeFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        authType={null}
        canManage={canManageAuthTypes}
      />

      <AuthTypeFormDialog
        open={!!editingAuthType}
        onOpenChange={(open) => !open && setEditingAuthType(null)}
        authType={editingAuthType}
        canManage={canManageAuthTypes}
      />

      <DeleteAuthTypeDialog
        open={!!deletingAuthType}
        onOpenChange={(open) => !open && setDeletingAuthType(null)}
        authType={deletingAuthType}
        canManage={canManageAuthTypes}
      />
    </>
  )
}
