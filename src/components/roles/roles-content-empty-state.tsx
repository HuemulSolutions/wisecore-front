import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RolesContentEmptyStateProps {
  error?: any
  onRetry?: () => void
}

export function RolesContentEmptyState({ error, onRetry }: RolesContentEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
      <p className="text-red-600 mb-4 font-medium">
        {error?.message || 'Failed to load roles'}
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        There was an error loading the data. Please try again.
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="hover:cursor-pointer">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  )
}
