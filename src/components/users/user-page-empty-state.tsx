import { Building, Shield } from "lucide-react"

interface EmptyStateProps {
  type: 'access-denied' | 'no-organization' | 'error'
  message?: string
}

export default function UserPageEmptyState({ type, message }: EmptyStateProps) {
  if (type === 'access-denied') {
    return (
      <div className="bg-background p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access user management.</p>
        </div>
      </div>
    )
  }

  if (type === 'no-organization') {
    return (
      <div className="bg-background p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Building className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-xl font-bold text-foreground mb-2">Organization Required</h2>
          <p className="text-muted-foreground">Please select an organization to view users.</p>
        </div>
      </div>
    )
  }

  if (type === 'error') {
    return (
      <div className="bg-background p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-foreground mb-2">Error loading users</div>
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    )
  }

  return null
}