import { Users, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface UserContentEmptyStateProps {
  type: 'empty' | 'error'
  message?: string
  onRetry?: () => void
}

export function UserContentEmptyState({ type, message, onRetry }: UserContentEmptyStateProps) {
  if (type === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
        <p className="text-red-600 mb-4 font-medium">{message || 'Failed to load users'}</p>
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

  // Empty state
  return (
    <Card className="p-8 text-center">
      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">No users found</h3>
      <p className="text-muted-foreground">
        No users match your current filters.
      </p>
    </Card>
  )
}