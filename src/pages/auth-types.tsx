import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useAuthTypes } from "@/hooks/useAuthTypes"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { CreateAuthTypeDialog } from "@/components/auth-types/auth-types-create-dialog"
import { EditAuthTypeDialog } from "@/components/auth-types/auth-types-edit-dialog"
import { DeleteAuthTypeDialog } from "@/components/auth-types/auth-types-delete-dialog"
import { toast } from "sonner"
import type { AuthType } from "@/services/auth-types"

import { AuthTypesSearch } from "@/components/auth-types/auth-types-search"
import { AuthTypesTable } from "@/components/auth-types/auth-types-table"
import { AuthTypesLoadingState } from "@/components/auth-types/auth-types-loading-state"
import { AuthTypesErrorState } from "@/components/auth-types/auth-types-error-state"

/**
 * Authentication Types management page
 * Provides interface for creating, editing, and managing authentication types
 */
export default function AuthTypes() {
  const { t } = useTranslation('common')
  const [inputSearch, setInputSearch] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [editingAuthType, setEditingAuthType] = useState<AuthType | null>(null)
  const [deletingAuthType, setDeletingAuthType] = useState<AuthType | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { isRootAdmin, isLoading: isLoadingPermissions } = useUserPermissions()
  
  // Solo hacer la llamada a la API si el usuario es admin
  const { data: authTypes = [], isLoading, isFetching, error, refetch } = useAuthTypes({
    enabled: isRootAdmin,
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

  // Verificar si el usuario es root admin
  if (!isRootAdmin) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">{t('accessDenied')}</h1>
          <p className="text-muted-foreground">{t('noPermission')}</p>
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
      toast.success(t('dataRefreshed'))
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto">
        <AuthTypesSearch
          searchTerm={inputSearch}
          onSearchChange={(value) => {
            setInputSearch(value)
            setSearchTerm(value)
            setPage(1)
          }}
          authTypesCount={error ? 0 : authTypes.length}
          isLoading={isRefreshing}
          onRefresh={handleRefresh}
          onCreateClick={() => setIsCreateDialogOpen(true)}
          hasError={!!error}
        />

        {error ? (
          <AuthTypesErrorState error={error} onRetry={handleRefresh} />
        ) : (
          <AuthTypesTable
            authTypes={pagedAuthTypes}
            onEdit={setEditingAuthType}
            onDelete={setDeletingAuthType}
            isLoading={isTableLoading}
            isFetching={isTableFetching}
            pagination={{
              page,
              pageSize,
              totalItems: authTypes.length,
              onPageChange: setPage,
              onPageSizeChange: (size) => { setPageSize(size); setPage(1) },
              pageSizeOptions: [5, 10, 25],
            }}
          />
        )}

        {/* Dialogs */}
        <CreateAuthTypeDialog 
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />

        <EditAuthTypeDialog
          open={!!editingAuthType}
          onOpenChange={(open) => !open && setEditingAuthType(null)}
          authType={editingAuthType}
        />

        <DeleteAuthTypeDialog
          open={!!deletingAuthType}
          onOpenChange={(open) => !open && setDeletingAuthType(null)}
          authType={deletingAuthType}
        />
      </div>
    </div>
  )
}