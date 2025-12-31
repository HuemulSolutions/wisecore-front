import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, RefreshCw, Plus } from "lucide-react"
import ProtectedComponent from "@/components/protected-component"

interface AuthTypesHeaderProps {
  authTypesCount: number
  isLoading: boolean
  onRefresh: () => void
  onCreateClick: () => void
  hasError?: boolean
}

export function AuthTypesHeader({ 
  authTypesCount, 
  isLoading, 
  onRefresh, 
  onCreateClick,
  hasError 
}: AuthTypesHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        <h1 className="text-lg sm:text-xl font-semibold text-foreground">Authentication Types</h1>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs px-2 py-1">
          {authTypesCount} auth types
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
        <ProtectedComponent requireRootAdmin>
          <Button 
            size="sm"
            onClick={onCreateClick}
            disabled={hasError}
            className="hover:cursor-pointer h-8 text-xs px-2"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Auth Type
          </Button>
        </ProtectedComponent>
      </div>
    </div>
  )
}