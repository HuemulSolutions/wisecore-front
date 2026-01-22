import { Shield, Plus } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

interface RolesSearchProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  rolesCount: number
  isRefreshing: boolean
  onRefresh: () => void
  onCreateRole: () => void
  hasError?: boolean
  canManage?: boolean
}

export function RolesSearch({ 
  searchTerm, 
  onSearchChange, 
  rolesCount, 
  isRefreshing,
  onRefresh,
  onCreateRole,
  hasError,
  canManage = false
}: RolesSearchProps) {
  return (
    <PageHeader
      icon={Shield}
      title="Roles & Permissions"
      badges={[
        { label: "", value: `${rolesCount} roles` }
      ]}
      onRefresh={onRefresh}
      isLoading={isRefreshing}
      hasError={hasError}
      primaryAction={canManage ? {
        label: "Create Role",
        icon: Plus,
        onClick: onCreateRole
      } : undefined}
      searchConfig={{
        placeholder: "Search roles...",
        value: searchTerm,
        onChange: onSearchChange
      }}
    />
  )
}
