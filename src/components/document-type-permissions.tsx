import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Shield } from "lucide-react"
import { useDocumentTypePermissions } from "@/hooks/useRoleDocumentType"

interface DocumentTypePermissionsProps {
  documentTypeId: string
}

export default function DocumentTypePermissions({ documentTypeId }: DocumentTypePermissionsProps) {
  const { data: permissionsData, isLoading, error } = useDocumentTypePermissions(documentTypeId)

  if (isLoading) {
    return (
      <div className="flex items-center gap-1">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Shield className="w-3 h-3" />
        <span className="text-xs">Error loading</span>
      </div>
    )
  }

  if (!permissionsData) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Shield className="w-3 h-3" />
        <span className="text-xs">No data</span>
      </div>
    )
  }

  const permissions = (permissionsData.data && Array.isArray(permissionsData.data)) ? permissionsData.data : []

  if (permissions.length === 0) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Shield className="w-3 h-3" />
        <span className="text-xs">No permissions</span>
      </div>
    )
  }

  // Group permissions by role to show unique roles
  const uniqueRoles = new Set(permissions.map(p => p.role_name || `Role ${p.role_id}`))

  if (uniqueRoles.size === 0) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Shield className="w-3 h-3" />
        <span className="text-xs">No roles assigned</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-1">
      {Array.from(uniqueRoles).map((roleName, index) => (
        <Badge key={index} variant="outline" className="text-xs">
          {roleName}
        </Badge>
      ))}
    </div>
  )
}