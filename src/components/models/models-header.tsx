import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, RefreshCw } from "lucide-react"

interface ModelsHeaderProps {
  configuredProviders: number
  totalModels: number
  isLoading: boolean
  onRefresh: () => void
}

export function ModelsHeader({ 
  configuredProviders, 
  totalModels, 
  isLoading, 
  onRefresh 
}: ModelsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        <h1 className="text-lg sm:text-xl font-semibold text-foreground">Models Configuration</h1>
      </div>
      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className="text-xs px-2 py-0.5">
          {configuredProviders} configured providers
        </Badge>
        <Badge variant="outline" className="text-xs px-2 py-0.5">
          {totalModels} models
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="hover:cursor-pointer h-8 text-xs px-2"
        >
          {isLoading ? (
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3 mr-1" />
          )}
          Refresh
        </Button>
      </div>
    </div>
  )
}