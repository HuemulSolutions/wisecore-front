import { Plus, RefreshCw, AlertCircle, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OrganizationContentEmptyStateProps {
  type: "empty" | "no-results" | "error"
  onCreateFirst?: () => void
  onClearFilters?: () => void
  onRetry?: () => void
  message?: string
}

export function OrganizationContentEmptyState({
  type,
  onCreateFirst,
  onClearFilters,
  onRetry,
  message
}: OrganizationContentEmptyStateProps) {
  if (type === "empty") {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Organizations Yet</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Get started by creating your first organization
        </p>
        {onCreateFirst && (
          <Button onClick={onCreateFirst} className="hover:cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        )}
      </div>
    )
  }

  if (type === "no-results") {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Organizations Found</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Try adjusting your search or filters
        </p>
        {onClearFilters && (
          <Button 
            variant="outline" 
            onClick={onClearFilters}
            className="hover:cursor-pointer"
          >
            Clear Filters
          </Button>
        )}
      </div>
    )
  }

  if (type === "error") {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Organizations</h3>
        <p className="text-sm text-muted-foreground mb-6">
          {message || "Something went wrong while loading the organizations"}
        </p>
        {onRetry && (
          <Button 
            variant="outline" 
            onClick={onRetry}
            className="hover:cursor-pointer"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    )
  }

  return null
}
