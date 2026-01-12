import { Shield, Plus } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

interface RolesHeaderProps {
  isRefreshing: boolean
  onRefresh: () => void
  onCreateRole: () => void
  hasError?: boolean
}

export function RolesHeader({ isRefreshing, onRefresh, onCreateRole, hasError }: RolesHeaderProps) {
  return (
    <PageHeader
      icon={Shield}
      title="Roles & Permissions"
      onRefresh={onRefresh}
      isLoading={isRefreshing}
      hasError={hasError}
      primaryAction={{
        label: "Create Role",
        icon: Plus,
        onClick: onCreateRole
      }}
    />
  )
}
