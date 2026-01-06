import { Button } from "@/components/ui/button"
import { Shield, RefreshCw, Plus } from "lucide-react"

interface RolesHeaderProps {
  isRefreshing: boolean
  onRefresh: () => void
  onCreateRole: () => void
  hasError?: boolean
}

export function RolesHeader({ isRefreshing, onRefresh, onCreateRole, hasError }: RolesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        <h1 className="text-lg sm:text-xl font-semibold text-foreground">Roles & Permissions</h1>
      </div>
      <div className="flex gap-1 sm:gap-2">
        <Button 
          onClick={onRefresh}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          className="hover:cursor-pointer h-8 text-xs px-2"
        >
          <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
        <Button 
          onClick={onCreateRole}
          disabled={hasError}
          className="hover:cursor-pointer h-8 text-xs px-2"
          size="sm"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          <span className="hidden sm:inline">Create Role</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </div>
    </div>
  )
}
