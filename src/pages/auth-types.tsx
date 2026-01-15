import { useState } from "react"
import { useAuthTypes } from "@/hooks/useAuthTypes"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { CreateAuthTypeDialog } from "@/components/auth-types/auth-types-create-dialog"
import { EditAuthTypeDialog } from "@/components/auth-types/auth-types-edit-dialog"
import { DeleteAuthTypeDialog } from "@/components/auth-types/auth-types-delete-dialog"
import { toast } from "sonner"
import type { AuthType } from "@/services/auth-types"

import { AuthTypesSearch } from "@/components/auth-types/auth-types-search"
import { AuthTypesTable } from "@/components/auth-types/auth-types-table"
import { AuthTypesEmptyState } from "@/components/auth-types/auth-types-empty-state"
import { AuthTypesLoadingState } from "@/components/auth-types/auth-types-loading-state"
import { AuthTypesErrorState } from "@/components/auth-types/auth-types-error-state"

/**
 * Authentication Types management page
 * Provides interface for creating, editing, and managing authentication types
 */
export default function AuthTypes() {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingAuthType, setEditingAuthType] = useState<AuthType | null>(null)
  const [deletingAuthType, setDeletingAuthType] = useState<AuthType | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { isRootAdmin } = useUserPermissions()
  const { data: authTypes = [], isLoading, error, refetch } = useAuthTypes()

  // Verificar si el usuario es root admin
  if (!isRootAdmin) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  // Function to refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast.success('Data refreshed')
    } finally {
      setIsRefreshing(false)
    }
  }

  const filteredAuthTypes = authTypes.filter((auth) => 
    auth.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return <AuthTypesLoadingState />
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto">
        <AuthTypesSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          authTypesCount={error ? 0 : authTypes.length}
          isLoading={isLoading || isRefreshing}
          onRefresh={handleRefresh}
          onCreateClick={() => setIsCreateDialogOpen(true)}
          hasError={!!error}
        />

        {error ? (
          <AuthTypesErrorState error={error} onRetry={handleRefresh} />
        ) : filteredAuthTypes.length === 0 ? (
          <AuthTypesEmptyState searchTerm={searchTerm} />
        ) : (
          <AuthTypesTable
            authTypes={authTypes}
            filteredAuthTypes={filteredAuthTypes}
            onEdit={setEditingAuthType}
            onDelete={setDeletingAuthType}
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