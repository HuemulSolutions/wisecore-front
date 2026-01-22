import { Package } from "lucide-react"

interface EmptyStateProps {
  type: 'access-denied' | 'error'
  message?: string
}

export default function AssetTypePageEmptyState({ type, message }: EmptyStateProps) {
  if (type === 'access-denied') {
    return (
      <div className="bg-background p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need administrator privileges to access this page.</p>
        </div>
      </div>
    )
  }

  if (type === 'error') {
    return (
      <div className="bg-background p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-foreground mb-2">Error loading asset types</div>
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    )
  }

  return null
}
