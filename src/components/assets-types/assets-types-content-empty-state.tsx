import { FileStack, RefreshCw, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface AssetTypeContentEmptyStateProps {
  type: 'empty' | 'error'
  message?: string
  onRetry?: () => void
  onCreateFirst?: () => void
}

export function AssetTypeContentEmptyState({ 
  type, 
  message, 
  onRetry,
  onCreateFirst 
}: AssetTypeContentEmptyStateProps) {
  if (type === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
        <p className="text-red-600 mb-4 font-medium">{message || 'Failed to load asset types'}</p>
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
      <div className="text-center py-12">
        <FileStack className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No asset types found</h3>
        <p className="text-muted-foreground mb-4">
          No asset types have been created yet.
        </p>
        {onCreateFirst && (
          <Button 
            size="sm"
            onClick={onCreateFirst}
            className="hover:cursor-pointer h-8 px-3"
          >
            <Plus className="w-3 h-3 mr-1" />
            Create First Asset Type
          </Button>
        )}
      </div>
    </Card>
  )
}
