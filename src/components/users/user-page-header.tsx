import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, RefreshCw } from "lucide-react"
import ProtectedComponent from "@/components/protected-component"

interface UserPageHeaderProps {
  userCount: number
  onCreateUser: () => void
  onRefresh: () => void
  isLoading: boolean
  hasError?: boolean
}

export default function UserPageHeader({ userCount, onCreateUser, onRefresh, isLoading, hasError }: UserPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        <h1 className="text-lg sm:text-xl font-semibold text-foreground">Users Management</h1>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs px-2 py-1">
          {userCount} users
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
        <ProtectedComponent permission="user:c">
          <Button 
            size="sm"
            onClick={onCreateUser}
            disabled={hasError}
            className="hover:cursor-pointer h-8 text-xs px-2"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add User
          </Button>
        </ProtectedComponent>
      </div>
    </div>
  )
}