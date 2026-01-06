import { Settings, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ModelsContentEmptyStateProps {
  type: 'empty' | 'error'
  message?: string
  onRetry?: () => void
}

export function ModelsContentEmptyState({ type, message, onRetry }: ModelsContentEmptyStateProps) {
  if (type === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
        <p className="text-red-600 mb-4 font-medium">{message || 'Failed to load models'}</p>
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
    <Card className="border border-border bg-card">
      <div className="text-center py-8">
        <Settings className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
        <h3 className="text-sm font-medium text-foreground mb-1">No providers configured</h3>
        <p className="text-xs text-muted-foreground">Configure providers above to start creating and managing AI models.</p>
      </div>
    </Card>
  )
}
