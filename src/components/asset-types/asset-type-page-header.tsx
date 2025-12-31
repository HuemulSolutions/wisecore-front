import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileStack, Plus, RefreshCw } from "lucide-react"

interface AssetTypePageHeaderProps {
  assetTypeCount: number
  onCreateAssetType: () => void
  onRefresh: () => void
  isLoading: boolean
  hasError?: boolean
}

export default function AssetTypePageHeader({ 
  assetTypeCount, 
  onCreateAssetType, 
  onRefresh, 
  isLoading, 
  hasError 
}: AssetTypePageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <div className="flex items-center gap-2">
        <FileStack className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        <h1 className="text-lg sm:text-xl font-semibold text-foreground">Asset Types</h1>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs px-2 py-1">
          {hasError ? 0 : assetTypeCount} types
        </Badge>
        <Button 
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="hover:cursor-pointer h-8 text-xs px-2"
        >
          {isLoading ? (
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3 mr-1" />
          )}
          Refresh
        </Button>
        <Button 
          size="sm"
          onClick={onCreateAssetType}
          disabled={hasError}
          className="hover:cursor-pointer h-8 text-xs px-2"
        >
          <Plus className="w-3 h-3 mr-1" />
          Create Asset Type
        </Button>
      </div>
    </div>
  )
}
